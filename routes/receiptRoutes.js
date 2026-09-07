import express from "express";
import Receipt from "../models/Receipt.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET RECEIPTS
router.get("/", protect, async (req, res) => {
  try {
    const receipts = await Receipt.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(receipts);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch receipts",
      error: error.message,
    });
  }
});

// SAVE SCANNED RECEIPT
router.post("/", protect, async (req, res) => {
  try {
    const {
      merchantName,
      amount,
      category,
      receiptImage,
      scannedText,
      transactionDate,
    } = req.body;

    const receipt = await Receipt.create({
      user: req.user._id,
      merchantName,
      amount,
      category,
      receiptImage,
      scannedText,
      transactionDate,
    });

    res.status(201).json({
      message: "Receipt saved successfully",
      receipt,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to save receipt",
      error: error.message,
    });
  }
});

// DELETE RECEIPT
router.delete("/:id", protect, async (req, res) => {
  try {
    const receipt = await Receipt.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        message: "Receipt not found",
      });
    }

    res.json({
      message: "Receipt deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete receipt",
      error: error.message,
    });
  }
});

export default router;