import express from "express";
import mongoose from "mongoose";
import FraudAlert from "../models/FraudAlert.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// @route GET /api/fraud
router.get("/", async (req, res, next) => {
  try {
    const alerts = await FraudAlert.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("transaction", "referenceNumber amount type date");
    res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/fraud/:id/status
// body: { status: "open" | "reviewed" | "dismissed" }
router.put("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["open", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid alert id" });
    }

    const alert = await FraudAlert.findOne({ _id: req.params.id, user: req.user._id });
    if (!alert) {
      return res.status(404).json({ message: "Fraud alert not found" });
    }

    alert.status = status;
    await alert.save();

    res.status(200).json({ alert });
  } catch (error) {
    next(error);
  }
});

export default router;
