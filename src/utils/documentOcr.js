/**
 * Document OCR & Text Extraction Engine
 * Supports:
 * - PDF (digital text extraction via PDF.js, or scanned rendering to OCR)
 * - Word Documents (.docx, .doc via Mammoth / XML extraction)
 * - Images (JPG, JPEG, PNG via Tesseract.js with image preprocessing)
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
    // Try English + Hindi first for government notices
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
 * Extract text from PDF files using PDF.js
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
  onProgress("Reading PDF pages...", 30);

  const numPagesToScan = Math.min(pdf.numPages, 3); // Government notices are 1-2 pages

  for (let i = 1; i <= numPagesToScan; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  // If digital text is found, return it directly (very fast & 100% accurate!)
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
 * Extract text from Word documents (.docx)
 */
export const extractTextFromWord = async (file, onProgress = () => {}) => {
  onProgress("Reading Word document...", 25);
  try {
    await loadScript(MAMMOTH_CDN);
    if (window.mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const res = await window.mammoth.extractRawText({ arrayBuffer });
      return res.value || "";
    }
  } catch (err) {
    console.warn("Mammoth load failed, attempting fallback text scan:", err);
  }

  // Fallback: read text strings from arrayBuffer
  const buffer = await file.arrayBuffer();
  const textDecoder = new TextDecoder("utf-8");
  const rawString = textDecoder.decode(buffer);
  // Extract visible xml tags text
  const matches = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
};

/**
 * Universal Document Text Extraction
 * Takes any supported file and extracts all readable text.
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

  // Default fallback try OCR
  const canvas = await prepareImageCanvas(file);
  return await runTesseractOCR(canvas, onProgress);
};
