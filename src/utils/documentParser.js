/**
 * AI-Based Dynamic Document Parser for Complaint Tracker
 * 
 * Replaces predefined/hardcoded formats (Format 1, 2, 3, etc.) with pure AI-based
 * analysis using Google Gemini or OpenAI API keys from environment (.env).
 * Dynamically identifies whatever fields and tables are present in the uploaded
 * document (PDF, JPG, PNG, Word) and auto-fills the complaint form fields.
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

  return "gemini"; // Default to Gemini
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

// Call Google Gemini API (2.0 Flash -> 1.5 Flash)
async function callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, onProgress }) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError = null;

  for (const model of models) {
    try {
      if (onProgress) onProgress(`AI analyzing document with ${model}...`, 65);

      const parts = [{ text: prompt }];

      if (fileBase64 && mimeType) {
        let validMime = mimeType;
        if (mimeType.includes("pdf")) validMime = "application/pdf";
        else if (mimeType.includes("png")) validMime = "image/png";
        else if (mimeType.includes("webp")) validMime = "image/webp";
        else validMime = "image/jpeg";

        parts.push({
          inlineData: {
            mimeType: validMime,
            data: fileBase64,
          },
        });
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

// Call OpenAI API (gpt-4o-mini -> gpt-4o)
async function callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, onProgress }) {
  const models = ["gpt-4o-mini", "gpt-4o"];
  let lastError = null;

  for (const model of models) {
    try {
      if (onProgress) onProgress(`AI analyzing document with ${model}...`, 65);

      const userContent = [{ type: "text", text: prompt }];

      if (fileBase64 && mimeType && !mimeType.includes("pdf")) {
        const dataUrl = `data:${mimeType};base64,${fileBase64}`;
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl },
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
              content: "You are an expert AI government document parser. Return JSON only.",
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
  onProgress,
}) {
  const provider = detectAIProvider(apiKey);

  if (provider === "openai") {
    try {
      return await callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, onProgress });
    } catch (e) {
      console.warn("OpenAI attempt failed, trying Gemini:", e.message);
      return await callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, onProgress });
    }
  } else {
    try {
      return await callGeminiAPI({ apiKey, prompt, fileBase64, mimeType, onProgress });
    } catch (e) {
      console.warn("Gemini attempt failed, trying OpenAI:", e.message);
      return await callOpenAIAPI({ apiKey, prompt, fileBase64, mimeType, onProgress });
    }
  }
}

// Fallback regex extractor (purely generic, without any Format 1/2/3 hardcoding)
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
    natureOfComplaint: "Equipment Non-Functional",
  };
}

/**
 * Main AI Document Parser Entry Point
 * Completely dynamic, format-independent AI document analyzer.
 */
export async function parseComplaintDocument(input, dropdownOptions = {}) {
  let file = null;
  let fileBase64 = "";
  let mimeType = "";
  let extractedText = "";
  let onProgress = () => {};

  if (typeof input === "object" && input !== null) {
    file = input.file || null;
    fileBase64 = input.fileBase64 || "";
    mimeType = input.mimeType || (file?.type) || "";
    extractedText = input.extractedText || input.text || "";
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
      formatName: "Fallback Parser (No AI Key in .env)",
      records: [{ recordIndex: 1, label: "Record 1 (Fallback)", data: fallbackRecord }],
      defaultRecord: fallbackRecord,
      totalRecords: 1,
    };
  }

  onProgress("Sending document to AI for intelligent extraction...", 55);

  const systemPrompt = `
You are an expert AI assistant specialized in analyzing Indian government letters, CREDA notices, Solar Pump / EPC service letters, and beneficiary complaints.
The document may be in Hindi, English, or a mix of both.

Carefully examine all text, tables, stamps, reference numbers, dates, beneficiary lists, equipment ratings, and locations.
Extract all complaint details dynamically WITHOUT assuming any rigid or predefined format.

Return ONLY a valid JSON object with the following structure:
{
  "documentType": "Short descriptive type (e.g. Government Complaint Notice, CREDA Letter, Service Rectification Report)",
  "records": [
    {
      "companyName": "Company name addressed to or mentioned (e.g. RBP Energy (India) Pvt. Ltd., Rotomag Motors & Controls, Premier Energies, Solex Energy, Suraj Enterprises, etc.)",
      "modeOfCall": "Letter",
      "modeOfLetter": "Notice or Letter or CM Help",
      "letterReferenceNumber": "Official reference number / पत्र क्रमांक / Ref No (e.g. 2386/क्रेडा/जि.का./SSY/2024-25)",
      "complaintNumber": "Inward / आवक number or complaint number if present, else letter reference number",
      "complaintDate": "Date in YYYY-MM-DD or DD/MM/YYYY format",
      "idNumber": "Beneficiary ID number / आई.डी. नं. (e.g. 706780, 701069, etc.) if mentioned",
      "projectName": "Project name (e.g. SSY Phase-08, SSY Phase-07, SSY Phase-06, SSY Phase-05, SPVPP, Saubhagya, Solar Pump)",
      "district": "District name in English (e.g. Surajpur, Balrampur, Gariyaband, Kabirdham, Bastar, Raipur, Kondagaon, Kanker, Bilaspur, Dantewada, etc.)",
      "beneficiaryName": "Name of beneficiary / farmer / site (e.g. Shri Ramesh Kumar, Sub Health Centre, etc.)",
      "contactNumber": "10-digit mobile number if found, else empty string",
      "village": "Village / स्थल / ग्राम name",
      "block": "Block / विकासखंड / वि.ख. name",
      "product": "Product name (e.g. Solar Module, Controller, Inverter, Motor+Pump, Street Light)",
      "make": "Brand / Make if mentioned (e.g. Rotomag Motors, Premier Energies, ICON, SHAKTI, ROTOSOL)",
      "rating": "Pump / System rating (e.g. 5 HP DC Sub., 3 HP DC Surf., 4.8 KW, 15W)",
      "qty": "Quantity (usually '1')",
      "controllerRidNo": "Controller RID if present, else empty string",
      "productSlNo": "Product serial number if present, else empty string",
      "insuranceType": "Insurance status (e.g. 'Panel Damage' if solar module is damaged/stolen, or 'Insurance' if mentioned, else empty string)",
      "natureOfComplaint": "Brief issue description (e.g. Solar Module Damaged, Inverter Faulty, Pump Not Working, Equipment Rectified & Functional)",
      "resolvedDate": "Date of resolution if explicitly stated as repaired/resolved, else null"
    }
  ]
}

CRITICAL RULES:
1. If the document has a table with multiple rows (e.g. 1, 2, 3... listing multiple beneficiaries or pumps), extract each row as a separate item in the "records" array.
2. If there is only one complaint / beneficiary, return an array with exactly 1 record.
3. Translate Hindi district names to standard English (e.g. सूरजपुर -> Surajpur, गरियाबंद -> Gariyaband).
4. Return pure JSON only. Do not wrap in markdown or backticks.
${extractedText ? `\n--- EXTRACTED DOCUMENT TEXT ---\n${extractedText}\n--- END TEXT ---` : ""}
`;

  try {
    const rawAiResponse = await executeAIAnalysis({
      apiKey,
      prompt: systemPrompt,
      fileBase64,
      mimeType,
      onProgress,
    });

    onProgress("Processing AI extraction results...", 90);

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

      return {
        recordIndex: idx + 1,
        label: `Record ${idx + 1}: ${d.beneficiaryName || "Beneficiary"} (${d.village || d.district || "Site"}) - ${d.product || "Complaint"}`,
        data: d,
      };
    });

    return {
      success: true,
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
      formatName: "Generic Scanner (AI fallback: " + (err.message ? err.message.slice(0, 40) : "Network error") + ")",
      records: [{ recordIndex: 1, label: "Record 1 (Fallback)", data: fallbackRecord }],
      defaultRecord: fallbackRecord,
      totalRecords: 1,
      warning: err.message,
    };
  }
}

export default parseComplaintDocument;
