/**
 * AI-Based Independent Document Parser for Complaint Tracker
 * 
 * Provides ChatGPT-grade document understanding for any uploaded document
 * (PDF, JPG, PNG, Word) completely format-independently.
 * Analyzes headings, tables, printed text, stamps, handwritten notes, and
 * accurately populates only the existing UI fields with zero guessing.
 */

// Clean text helper
export const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
};

// District name mapping (Hindi -> English)
export const DISTRICT_MAP = {
  "सूरजपुर": "Surajpur",
  "गरियाबंद": "Gariyaband",
  "बलरामपुर": "Balrampur",
  "कबीरधाम": "Kabirdham",
  "कवर्धा": "Kabirdham",
  "जशपुर": "Jashpur",
  "मुंगेली": "Mungeli",
  "बस्तर": "Bastar",
  "रायपुर": "Raipur",
  "कोरिया": "Koriya",
  "सरगुजा": "Surguja",
  "राजनांदगांव": "Rajnandgaon",
  "रायगढ़": "Raigarh",
  "बिलासपुर": "Bilaspur",
  "कांकेर": "Kanker",
  "दंतेवाड़ा": "Dantewada",
  "महासमुंद": "Mahasamund",
  "धमतरी": "Dhamtari",
  "जांजगीर-चांपा": "Janjgir-Champa",
  "कोरबा": "Korba",
  "कोण्डागांव": "Kondagaon",
  "कोंडागांव": "Kondagaon",
  "सुकमा": "Sukma",
  "बीजापुर": "Bijapur",
  "नारायणपुर": "Narayanpur",
  "बेमेतरा": "Bemetara",
  "बालोद": "Balod",
  "बलौदाबाजार": "Baloda Bazar",
  "सक्ती": "Sakti",
  "सारंगढ़-बिलाईगढ़": "Sarangarh-Bilaigarh",
  "मोहला-मानपुर": "Mohla-Manpur",
  "खैरागढ़": "Khairagarh",
  "मनेन्द्रगढ़": "Manendragarh"
};

// Helper: Convert File or Blob to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      if (typeof res === "string") {
        const parts = res.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : (file.type || "application/octet-stream");
        const base64Data = parts[1];
        resolve({ base64Data, mimeType, dataUrl: res });
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Helper: Get AI API Key from .env (checks all potential variable names)
export const getAIApiKey = () => {
  const env = import.meta.env || {};

  const candidates = [
    env.VITE_AI_API_KEY,
    env.AI_API_KEY,
    env.VITE_GEMINI_API_KEY,
    env.GEMINI_API_KEY,
    env.VITE_OPENAI_API_KEY,
    env.OPENAI_API_KEY,
    env.VITE_GOOGLE_API_KEY,
    env.GOOGLE_API_KEY,
    env.VITE_API_KEY,
    env.API_KEY,
    env.VITE_GEMINI_KEY,
    env.GEMINI_KEY,
    env.VITE_OPENAI_KEY,
    env.OPENAI_KEY
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }

  // Scan import.meta.env dynamically
  for (const [key, val] of Object.entries(env)) {
    const kUpper = key.toUpperCase();
    if (
      (kUpper.includes("API_KEY") ||
        kUpper.includes("GEMINI") ||
        kUpper.includes("OPENAI") ||
        kUpper.includes("AI_KEY")) &&
      typeof val === "string" &&
      val.trim()
    ) {
      return val.trim();
    }
  }

  return "";
};

// Helper: Detect whether the key belongs to Google Gemini or OpenAI
export const detectAIProvider = (apiKey) => {
  if (!apiKey) return "gemini";
  if (apiKey.startsWith("AIzaSy") || apiKey.startsWith("AIza")) return "gemini";
  if (apiKey.startsWith("sk-")) return "openai";

  const env = import.meta.env || {};
  if (env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY) return "openai";
  if (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY) return "gemini";

  return "gemini";
};

// Fuzzy matcher for dropdown options
export const matchWithOption = (val, options = []) => {
  if (!val || !options || options.length === 0) return val || "";
  const vLower = val.toLowerCase().trim();

  // 1. Exact match
  const exact = options.find((opt) => opt && opt.toLowerCase().trim() === vLower);
  if (exact) return exact;

  // 2. Substring match
  const sub = options.find(
    (opt) => opt && (opt.toLowerCase().includes(vLower) || vLower.includes(opt.toLowerCase()))
  );
  if (sub) return sub;

  return val;
};

// Call Google Gemini API (gemini-2.0-flash -> gemini-1.5-flash)
async function callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, pageImages = [], onProgress }) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError = null;

  for (const model of models) {
    try {
      if (onProgress) onProgress(`AI analyzing document with ${model}...`, 70);

      const parts = [{ text: prompt }];

      // Pass multi-page images if available
      if (pageImages && pageImages.length > 0) {
        for (const imgB64 of pageImages) {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imgB64,
            },
          });
        }
      } else if (fileBase64 && mimeType) {
        let validMime = mimeType;
        if (mimeType.includes("pdf")) validMime = "application/pdf";
        else if (mimeType.includes("png")) validMime = "image/png";
        else if (mimeType.includes("webp")) validMime = "image/webp";
        else if (mimeType.startsWith("image/")) validMime = "image/jpeg";

        if (validMime.startsWith("image/") || validMime === "application/pdf") {
          parts.push({
            inlineData: {
              mimeType: validMime,
              data: fileBase64,
            },
          });
        }
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Gemini ${model} HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response from Gemini AI");

      return rawText;
    } catch (err) {
      console.warn(`Gemini ${model} notice:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to process document with Gemini AI");
}

// Call OpenAI API (gpt-4o-mini -> gpt-4o) with ChatGPT-like Vision
async function callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, pageImages = [], onProgress }) {
  const models = ["gpt-4o-mini", "gpt-4o"];
  let lastError = null;

  for (const model of models) {
    try {
      if (onProgress) onProgress(`AI analyzing document with ${model}...`, 70);

      const userContent = [{ type: "text", text: prompt }];

      // Pass multi-page images for vision understanding
      if (pageImages && pageImages.length > 0) {
        for (const imgB64 of pageImages) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imgB64}` },
          });
        }
      } else if (fileBase64 && mimeType && mimeType.startsWith("image/")) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${fileBase64}` },
        });
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert AI document analyzer specialized in reading, analyzing, and extracting data from Indian documents, government notices, CREDA letters, EPC/Solar service records, and complaint letters. Return JSON only.",
            },
            {
              role: "user",
              content: userContent,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `OpenAI ${model} HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) throw new Error("Empty response from OpenAI");

      return rawText;
    } catch (err) {
      console.warn(`OpenAI ${model} notice:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to process document with OpenAI");
}

// Universal AI Caller
export async function executeAIAnalysis({
  apiKey,
  prompt,
  fileBase64,
  mimeType,
  pageImages = [],
  onProgress,
}) {
  const provider = detectAIProvider(apiKey);

  if (provider === "openai") {
    try {
      return await callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, pageImages, onProgress });
    } catch (e) {
      console.warn("OpenAI attempt failed, trying Gemini:", e.message);
      return await callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, pageImages, onProgress });
    }
  } else {
    try {
      return await callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, pageImages, onProgress });
    } catch (e) {
      console.warn("Gemini attempt failed, trying OpenAI:", e.message);
      return await callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, pageImages, onProgress });
    }
  }
}

// Fallback regex extractor (purely generic, without any predefined formats)
function extractGenericFallback(text) {
  const refMatch = text.match(/(?:क्रमांक|पत्र\s*क्र\.?|Ref(?:\s*No\.?)?)[:\s]*([0-9A-Za-z\u0900-\u097F\.\-_]+(?:\/[0-9A-Za-z\u0900-\u097F\.\-_]+)+)/i);
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  const idMatch = text.match(/\b(\d{6,7})\b/);

  let district = "";
  for (const [hindi, eng] of Object.entries(DISTRICT_MAP)) {
    if (text.includes(hindi) || new RegExp(`\\b${eng}\\b`, "i").test(text)) {
      district = eng;
      break;
    }
  }

  return {
    companyName: "",
    modeOfCall: "Letter",
    modeOfLetter: "Notice",
    letterReferenceNumber: refMatch ? refMatch[1] : "",
    complaintNumber: refMatch ? refMatch[1].split("/")[0] : "",
    complaintDate: dateMatch ? dateMatch[1] : null,
    idNumber: idMatch ? idMatch[1] : "",
    projectName: "",
    district: district,
    beneficiaryName: "",
    contactNumber: phoneMatch ? phoneMatch[1] : "",
    village: "",
    block: "",
    product: "",
    make: "",
    rating: "",
    qty: "1",
    controllerRidNo: "",
    productSlNo: "",
    insuranceType: "",
    resolvedDate: null,
    natureOfComplaint: "",
    challanNo: "",
    challanDate: null,
  };
}

/**
 * Main AI Document Parser Entry Point
 * Completely dynamic, format-independent ChatGPT-like document reader.
 */
export async function parseComplaintDocument(input, dropdownOptions = {}) {
  let file = null;
  let fileBase64 = "";
  let mimeType = "";
  let extractedText = "";
  let pageImages = [];
  let onProgress = () => {};

  if (typeof input === "object" && input !== null) {
    file = input.file || null;
    fileBase64 = input.fileBase64 || "";
    mimeType = input.mimeType || file?.type || "";
    extractedText = input.extractedText || input.text || "";
    pageImages = input.pageImages || [];
    onProgress = input.onProgress || onProgress;
    dropdownOptions = input.dropdownOptions || dropdownOptions;
  } else if (typeof input === "string") {
    extractedText = input;
  }

  const apiKey = getAIApiKey();

  if (!apiKey) {
    console.warn("AI API Key missing in environment (.env). Running fallback extraction.");
    const fallbackRecord = extractGenericFallback(extractedText);
    return {
      success: true,
      documentType: "Fallback Parser (No AI Key in .env)",
      formatName: "Fallback Document Scanner",
      records: [{ recordIndex: 1, label: "Record 1 (Fallback)", data: fallbackRecord }],
      defaultRecord: fallbackRecord,
      totalRecords: 1,
    };
  }

  onProgress("Sending document to AI for intelligent ChatGPT-grade analysis...", 60);

  const systemPrompt = `
You are an advanced AI document understanding engine (similar to ChatGPT Document Vision).
Analyze the uploaded document completely, independently, and objectively.

CRITICAL INSTRUCTIONS:
1. NO FORMAT ASSUMPTIONS: Do NOT expect or depend on any predefined format, template, or hardcoded layout. Documents can come from various departments (CREDA, State Solar Water Pumping schemes, Jal Jeevan Mission, Discoms, etc.), companies (Solex, Rotomag, Premier Energies, Shakti, Lubi, RBP, etc.), or private customers.
2. THOROUGH READING: Read all text across all pages, headings, reference numbers, dates, subject lines, tables, rows, columns, stamps, signatures, and handwritten notes.
3. TABLE / MULTI-RECORD HANDLING:
   - If the document contains a table with multiple complaint rows or beneficiaries (e.g. 1, 2, 3... or Sr.No.), extract EACH row as an individual object in the "records" array.
   - Each record must contain its own specific row values (beneficiaryName, idNumber, contactNumber, village, block, rating, product, make, controllerRidNo, productSlNo, natureOfComplaint).
   - Document-level header values (companyName, letterReferenceNumber, complaintDate, projectName, district) should be associated with each record in that document.
   - If there is only one complaint / beneficiary in the document, return an array with exactly 1 record.
4. FILL ONLY EXISTING UI FIELDS:
   Map extracted data ONLY to the following exact fields:
   - "companyName": Company addressed to or mentioned (e.g. RBP Energy (India) Pvt. Ltd., Rotomag Motors & Controls, Solex Energy, Premier Energies, Suraj Enterprises, etc.)
   - "modeOfCall": "Letter" if this is a written letter/notice/complaint, else "Call"
   - "modeOfLetter": "Notice" or "Letter" or "CM Help" or "Reminder"
   - "letterReferenceNumber": Official reference / dispatch number / पत्र क्रमांक / Ref No (e.g. 2386/क्रेडा/जि.का./SSY/2024-25)
   - "complaintNumber": Specific complaint number or inward number if present, else letter reference number
   - "complaintDate": Date of letter / complaint in "YYYY-MM-DD" format
   - "idNumber": Beneficiary ID / Saral ID / Farmer Application / Registration No. (e.g. 706780)
   - "projectName": Scheme or Project name (e.g. SSY Phase-08, SSY Phase-07, PM-KUSUM, SPVPP, Jal Jeevan Mission, etc.)
   - "district": District name in English title case (e.g. Surajpur, Balrampur, Gariyaband, Kabirdham, Bastar, Raipur, etc.)
   - "beneficiaryName": Full name of beneficiary / farmer / site / institution
   - "contactNumber": 10-digit mobile number if clearly mentioned, else ""
   - "village": Village / Gram / Sthal name
   - "block": Block / Tehsil / Vikas Khand name
   - "product": Product or pump type (e.g. Solar Pump, Solar Module, Controller, Inverter, Submersible Pump, Surface Pump, Street Light)
   - "make": Brand or Make if mentioned (e.g. Rotomag Motors, Premier Energies, ICON, SHAKTI, ROTOSOL, Solex)
   - "rating": System rating or capacity (e.g. 3 HP DC Sub., 5 HP DC Surf., 7.5 HP, 15W, 300W)
   - "qty": Quantity (usually "1")
   - "controllerRidNo": Controller RID number if explicitly indicated, else ""
   - "productSlNo": Motor / Pump / Module serial number if explicitly indicated, else ""
   - "insuranceType": If insurance or damage type is indicated (e.g. "Panel Damage" if solar module damaged/stolen, or "Insurance", else "")
   - "natureOfComplaint": Issue description / fault (e.g. Solar Module Damaged, Inverter Faulty, Pump Not Working, Controller Burnt)
   - "resolvedDate": Date in "YYYY-MM-DD" ONLY if document explicitly states that the issue has been resolved/repaired, else null
   - "challanNo": Challan number if mentioned, else ""
   - "challanDate": Challan date in "YYYY-MM-DD" if mentioned, else null

5. STRICT DATA ACCURACY – ABSOLUTELY NO GUESSING:
   - ONLY extract data that is clearly and explicitly available in the document.
   - If any field is NOT found or unclear in the document, you MUST set it to an empty string "" (or null for dates).
   - NEVER invent, assume, calculate, or guess any value.
   - NEVER put unrelated information into fields (e.g. do not put reference numbers into contactNumber or controllerRidNo).
   - Ambiguous or unreadable text must be left as empty string "".

6. LANGUAGE & TRANSLATION:
   - Translate Hindi district names to standard English (e.g. सूरजपुर -> Surajpur, गरियाबंद -> Gariyaband).

Return ONLY a valid JSON object matching this schema:
{
  "documentType": "Short descriptive title of document",
  "records": [
    {
      "companyName": "",
      "modeOfCall": "Letter",
      "modeOfLetter": "Notice",
      "letterReferenceNumber": "",
      "complaintNumber": "",
      "complaintDate": "YYYY-MM-DD",
      "idNumber": "",
      "projectName": "",
      "district": "",
      "beneficiaryName": "",
      "contactNumber": "",
      "village": "",
      "block": "",
      "product": "",
      "make": "",
      "rating": "",
      "qty": "1",
      "controllerRidNo": "",
      "productSlNo": "",
      "insuranceType": "",
      "natureOfComplaint": "",
      "resolvedDate": null,
      "challanNo": "",
      "challanDate": null
    }
  ]
}

${extractedText ? `\n--- EXTRACTED DOCUMENT TEXT CONTENT ---\n${extractedText}\n--- END TEXT CONTENT ---` : ""}
`;

  try {
    const rawAiResponse = await executeAIAnalysis({
      apiKey,
      prompt: systemPrompt,
      fileBase64,
      mimeType,
      pageImages,
      onProgress,
    });

    onProgress("Processing AI document extraction results...", 90);

    const cleanJson = rawAiResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsedJson = JSON.parse(cleanJson);
    const rawRecords = Array.isArray(parsedJson.records) && parsedJson.records.length > 0
      ? parsedJson.records
      : (parsedJson.record ? [parsedJson.record] : []);

    if (rawRecords.length === 0) {
      throw new Error("AI did not find any complaint records in the document");
    }

    // Normalize records with form dropdown options
    const {
      companyNameOptions = [],
      districtOptions = [],
      projectNameOptions = [],
      insuranceTypeOptions = [],
      modeOfLetterOptions = [],
    } = dropdownOptions;

    const normalizedRecords = rawRecords.map((item, idx) => {
      const d = { ...item };

      // Map Hindi district if any
      if (d.district && DISTRICT_MAP[d.district.trim()]) {
        d.district = DISTRICT_MAP[d.district.trim()];
      }

      if (d.companyName && companyNameOptions.length > 0) {
        d.companyName = matchWithOption(d.companyName, companyNameOptions);
      }
      if (d.district && districtOptions.length > 0) {
        d.district = matchWithOption(d.district, districtOptions);
      }
      if (d.projectName && projectNameOptions.length > 0) {
        d.projectName = matchWithOption(d.projectName, projectNameOptions);
      }
      if (d.insuranceType && insuranceTypeOptions.length > 0) {
        d.insuranceType = matchWithOption(d.insuranceType, insuranceTypeOptions);
      }
      if (d.modeOfLetter && modeOfLetterOptions.length > 0) {
        d.modeOfLetter = matchWithOption(d.modeOfLetter, modeOfLetterOptions);
      }

      const bName = d.beneficiaryName ? d.beneficiaryName.trim() : "";
      const loc = d.village || d.block || d.district || "";
      const prod = d.product || d.rating || "Complaint";
      const label = bName
        ? `Record ${idx + 1}: ${bName} ${loc ? `(${loc})` : ""} - ${prod}`
        : `Record ${idx + 1}: ${loc ? `(${loc})` : ""} ${prod}`;

      return {
        recordIndex: idx + 1,
        label,
        data: d,
      };
    });

    return {
      success: true,
      documentType: parsedJson.documentType || "AI Document Analysis",
      formatName: parsedJson.documentType || "AI Document Analysis",
      records: normalizedRecords,
      defaultRecord: normalizedRecords[0].data,
      totalRecords: normalizedRecords.length,
    };
  } catch (err) {
    console.error("AI Document Parsing error:", err);

    // If AI call failed, fallback to generic regex parser
    const fallbackRecord = extractGenericFallback(extractedText);
    return {
      success: true,
      documentType: "Generic Scanner",
      formatName: "Generic Scanner (AI: " + (err.message ? err.message.slice(0, 35) : "Error") + ")",
      records: [{ recordIndex: 1, label: "Record 1 (Fallback)", data: fallbackRecord }],
      defaultRecord: fallbackRecord,
      totalRecords: 1,
      warning: err.message,
    };
  }
}

export default parseComplaintDocument;
