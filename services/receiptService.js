// Deprecated: OCR is now implemented for real in services/ocrService.js
// using Tesseract.js (see extractTextFromImage / parseReceiptText), wired
// up in routes/receiptRoutes.js via POST /api/receipts/scan. This file is
// kept only so any stray import doesn't crash the app; it is no longer
// used by any route.
export { isOCRAvailable as isOCRConfigured } from "./ocrService.js";