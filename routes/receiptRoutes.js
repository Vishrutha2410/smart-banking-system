import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Receipt from "../models/Receipt.js";
import { protect } from "../middleware/authMiddleware.js";
import { isOCRAvailable, extractTextFromImage, parseReceiptText } from "../services/ocrService.js";

const router = express.Router();
router.use(protect);

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Memory storage only - the image buffer is processed in-place and
// discarded after OCR. No temporary file is ever written to disk, so
// there is nothing to clean up afterward.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be smaller than 5MB" });
      }
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    next();
  });
};

// @route GET /api/receipts
router.get("/", async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ receipts, ocrAvailable: isOCRAvailable() });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/receipts/scan
// Authenticated. Accepts multipart/form-data with an "image" field.
// Runs OCR and returns extracted fields WITHOUT creating a receipt or
// transaction - the user must review/edit and confirm separately.
router.post("/scan", handleUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "An image file is required" });
    }

    const rawText = await extractTextFromImage(req.file.buffer);
    const parsed = parseReceiptText(rawText);

    res.status(200).json({
      merchant: parsed.merchant,
      date: parsed.date,
      amount: parsed.amount,
      category: parsed.category,
      rawText,
    });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/receipts
// Saves a receipt log entry (after OCR review+confirm, or fully manual).
// This does NOT move money - use POST /api/accounts/:id/debit for that.
// body: { merchant, amount, category, date, extractedText, imagePath, source }
router.post("/", async (req, res, next) => {
  try {
    const { merchant, amount, category, date, extractedText, imagePath, source } = req.body;

    if (!merchant || !merchant.trim()) {
      return res.status(400).json({ message: "merchant is required" });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const receipt = await Receipt.create({
      user: req.user._id,
      merchant: merchant.trim(),
      amount: numericAmount,
      category: category || "General",
      date: date ? new Date(date) : new Date(),
      extractedText: extractedText || "",
      imagePath: imagePath || "",
      source: source === "ocr" ? "ocr" : "manual",
    });

    res.status(201).json({ receipt, ocrAvailable: isOCRAvailable() });
  } catch (error) {
    next(error);
  }
});

// @route DELETE /api/receipts/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid receipt id" });
    }
    const receipt = await Receipt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    res.status(200).json({ message: "Receipt deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;