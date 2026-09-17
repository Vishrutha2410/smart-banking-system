// Real OCR using Tesseract.js. Runs entirely in the backend process -
// no external API key, no data leaves the server, nothing is exposed
// to the frontend. Images are processed from an in-memory buffer only
// (multer uses memoryStorage) so no temporary file ever touches disk.
import { createWorker } from "tesseract.js";

export const isOCRAvailable = () => true;

// Extracts raw text from an image buffer using Tesseract.js.
export const extractTextFromImage = async (imageBuffer) => {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    return text || "";
  } finally {
    await worker.terminate();
  }
};

const CATEGORY_KEYWORDS = {
  Groceries: ["grocery", "groceries", "supermarket", "mart", "provision"],
  Dining: ["restaurant", "cafe", "café", "diner", "eatery", "food court", "bistro"],
  Fuel: ["fuel", "petrol", "diesel", "gas station", "filling station"],
  Travel: ["airlines", "airways", "hotel", "resort", "travel agency"],
  Shopping: ["mall", "store", "retail", "boutique", "apparel"],
  Utilities: ["electricity", "water bill", "utility", "utilities", "broadband"],
  Health: ["pharmacy", "medical", "hospital", "clinic", "chemist"],
  Entertainment: ["cinema", "movie", "theatre", "theater", "multiplex"],
};

// Looks for a category keyword anywhere in the OCR text. Returns null
// (not a guessed default) if nothing matches, per the "never invent
// missing information" requirement.
const findCategory = (text) => {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return null;
};

// Prefers a line explicitly labeled total/amount/balance due; falls back
// to the largest currency-like number found anywhere in the text. Returns
// null if no confident number is found at all.
const findAmount = (text) => {
  const totalLineRegex = /(total|amount due|grand total|balance due|net amount)[^0-9]{0,10}([0-9][0-9,]*\.?[0-9]{0,2})/i;
  const lines = text.split("\n");

  for (const line of lines) {
    const match = line.match(totalLineRegex);
    if (match) {
      const value = parseFloat(match[2].replace(/,/g, ""));
      if (!isNaN(value) && value > 0) return value;
    }
  }

  const numberMatches = [...text.matchAll(/\b\d{1,3}(,\d{3})*(\.\d{1,2})?\b/g)]
    .map((m) => parseFloat(m[0].replace(/,/g, "")))
    .filter((n) => !isNaN(n) && n > 0);

  if (numberMatches.length === 0) return null;
  return Math.max(...numberMatches);
};

// Looks for common date formats and normalizes to YYYY-MM-DD.
// Returns null if no valid date-like pattern is found.
const findDate = (text) => {
  let match = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (match) {
    const [, d, mo, y] = match;
    const day = Number(d);
    const month = Number(mo);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  match = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (match) return match[0];

  return null;
};

// The first line with enough letters in it is a reasonable heuristic for
// a merchant/store name printed at the top of a receipt. Returns null
// rather than guessing if nothing qualifies.
const findMerchant = (text) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount >= 3) return line;
  }

  return null;
};

// Parses OCR raw text into structured fields. Never invents values -
// any field that can't be confidently identified comes back as null so
// the frontend can prompt the user to fill it in manually.
export const parseReceiptText = (rawText) => {
  const text = rawText || "";
  return {
    merchant: findMerchant(text),
    date: findDate(text),
    amount: findAmount(text),
    category: findCategory(text),
  };
};