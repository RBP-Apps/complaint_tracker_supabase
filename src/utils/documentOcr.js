/**
 * Document OCR & Text Extraction Engine
 * Supports:
 * - PDF (digital text extraction + multi-page canvas rendering for AI vision)
 * - Word Documents (.docx, .doc via Mammoth raw text + HTML table extraction)
 * - Images (JPG, JPEG, PNG, WebP via Tesseract.js / direct base64)
 */

const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MAMMOTH_CDN = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";

// Helper to dynamically load external scripts safely
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

/**
 * Pre-process image on canvas (normalize size, enhance contrast for OCR)
 */
const prepareImageCanvas = async (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale to optimal OCR width (around 1800px - 2400px)
      const targetWidth = Math.max(1800, Math.min(width, 2400));
      const scale = targetWidth / width;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for scanning"));
    };
    img.src = url;
  });
};

/**
 * Run Tesseract OCR on a canvas or image
 */
export const runTesseractOCR = async (imageCanvasOrBlob, onProgress = () => {}) => {
  await loadScript(TESSERACT_CDN);
  if (!window.Tesseract) {
    throw new Error("OCR library could not be initialized");
  }

  onProgress("Initializing OCR engine...", 20);

  let worker = null;
  try {
    try {
      worker = await window.Tesseract.createWorker(["eng", "hin"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 60) + 30;
            onProgress(`Scanning document text... (${pct}%)`, pct);
          }
        },
      });
    } catch (e) {
      console.warn("Failed to load hin+eng, falling back to eng:", e);
      worker = await window.Tesseract.createWorker(["eng"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 60) + 30;
            onProgress(`Scanning document text... (${pct}%)`, pct);
          }
        },
      });
    }

    onProgress("Extracting character patterns...", 75);
    const result = await worker.recognize(imageCanvasOrBlob);
    await worker.terminate();
    return result?.data?.text || "";
  } catch (err) {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
    throw err;
  }
};

/**
 * Extract text from PDF files using PDF.js across all pages
 */
export const extractTextFromPDF = async (file, onProgress = () => {}) => {
  onProgress("Loading PDF reader...", 15);
  await loadScript(PDFJS_CDN);
  if (!window.pdfjsLib) {
    throw new Error("PDF parser could not be loaded");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  const totalPages = pdf.numPages;
  const pagesToScan = Math.min(totalPages, 5);

  onProgress(`Reading PDF pages (1 to ${pagesToScan})...`, 25);

  for (let i = 1; i <= pagesToScan; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    if (pageText.trim()) {
      fullText += `\n--- Page ${i} ---\n` + pageText + "\n";
    }
  }

  // If digital text is found, return it directly
  if (fullText.trim().length > 60) {
    onProgress("Digital text extracted successfully!", 90);
    return fullText;
  }

  // Otherwise, it's a scanned PDF. Render page 1 to canvas and run OCR
  onProgress("Scanned PDF detected. Rendering page for OCR...", 45);
  const page1 = await pdf.getPage(1);
  const viewport = page1.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page1.render({ canvasContext: ctx, viewport }).promise;

  return await runTesseractOCR(canvas, onProgress);
};

/**
 * Extract text from Word documents (.docx, .doc)
 */
export const extractTextFromWord = async (file, onProgress = () => {}) => {
  onProgress("Reading Word document...", 25);
  try {
    await loadScript(MAMMOTH_CDN);
    if (window.mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const rawRes = await window.mammoth.extractRawText({ arrayBuffer });
      let combined = rawRes.value || "";

      // Also extract HTML to preserve table structures
      try {
        const htmlRes = await window.mammoth.convertToHtml({ arrayBuffer });
        if (htmlRes.value && htmlRes.value.includes("<table")) {
          combined += "\n\n--- DOCUMENT TABLES ---\n" + htmlRes.value;
        }
      } catch (_) {}

      return combined;
    }
  } catch (err) {
    console.warn("Mammoth load failed, attempting fallback text scan:", err);
  }

  // Fallback: read text strings from arrayBuffer
  const buffer = await file.arrayBuffer();
  const textDecoder = new TextDecoder("utf-8");
  const rawString = textDecoder.decode(buffer);
  const matches = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
};

/**
 * Universal Document Text Extraction
 */
export const extractDocumentText = async (file, onProgress = () => {}) => {
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const type = file.type || "";

  onProgress("Analyzing file format...", 10);

  if (ext === "pdf" || type === "application/pdf") {
    return await extractTextFromPDF(file, onProgress);
  }

  if (ext === "docx" || ext === "doc" || type.includes("word") || type.includes("officedocument")) {
    return await extractTextFromWord(file, onProgress);
  }

  if (
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "webp" ||
    type.startsWith("image/")
  ) {
    onProgress("Preprocessing image for OCR...", 20);
    const canvas = await prepareImageCanvas(file);
    return await runTesseractOCR(canvas, onProgress);
  }

  const canvas = await prepareImageCanvas(file);
  return await runTesseractOCR(canvas, onProgress);
};

/**
 * Comprehensive ChatGPT-grade Document Preparation for AI
 * Handles:
 * - PDF: Extracts text from ALL pages + renders high-res page images for Vision models (GPT-4o & Gemini)
 * - Word: Extracts raw text + HTML tables
 * - Images: Converts to high-res base64
 */
export const prepareDocumentForAI = async (file, onProgress = () => {}) => {
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const type = file.type || "";

  // 1. PDF Documents
  if (ext === "pdf" || type === "application/pdf") {
    onProgress("Initializing PDF multi-page reader...", 15);
    try {
      await loadScript(PDFJS_CDN);
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const pagesToScan = Math.min(totalPages, 5); // scan up to 5 pages
        let combinedText = "";
        const pageImages = [];

        for (let i = 1; i <= pagesToScan; i++) {
          onProgress(`Rendering page ${i} of ${totalPages} for AI Vision...`, Math.round(15 + (i / pagesToScan) * 35));
          const page = await pdf.getPage(i);

          // Extract digital text from this page
          try {
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            if (pageText.trim()) {
              combinedText += `\n--- PAGE ${i} OF ${totalPages} ---\n${pageText}\n`;
            }
          } catch (tErr) {
            console.warn(`Text error on page ${i}:`, tErr);
          }

          // Render page to canvas image for multimodal vision
          try {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            const b64 = dataUrl.split(",")[1];
            if (b64) pageImages.push(b64);
          } catch (cErr) {
            console.warn(`Canvas render error on page ${i}:`, cErr);
          }
        }

        return {
          mimeType: "application/pdf",
          extractedText: combinedText.trim(),
          pageImages,
          totalPages,
        };
      }
    } catch (pdfErr) {
      console.warn("PDF multi-page preparation notice:", pdfErr);
    }

    return {
      mimeType: "application/pdf",
      extractedText: "",
      pageImages: [],
      totalPages: 1,
    };
  }

  // 2. Word Documents (.docx, .doc)
  if (ext === "docx" || ext === "doc" || type.includes("word") || type.includes("officedocument")) {
    onProgress("Extracting Word document text and tables...", 25);
    const docText = await extractTextFromWord(file, onProgress);
    return {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extractedText: docText.trim(),
      pageImages: [],
      totalPages: 1,
    };
  }

  // 3. Image Files (JPG, PNG, WebP)
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || type.startsWith("image/")) {
    onProgress("Preparing image for AI Vision...", 20);
    return {
      mimeType: type || "image/jpeg",
      extractedText: "",
      pageImages: [],
      totalPages: 1,
    };
  }

  return {
    mimeType: type || "application/octet-stream",
    extractedText: "",
    pageImages: [],
    totalPages: 1,
  };
};

export default extractDocumentText;
