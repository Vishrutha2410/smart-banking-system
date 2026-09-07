import express from "express";
import Budget from "../models/Budget.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET BUDGETS
router.get("/", protect, async (req, res) => {
  try {
    const budgets = await Budget.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(budgets);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budgets",
      error: error.message,
    });
  }
});

// CREATE BUDGET
router.post("/", protect, async (req, res) => {
  try {
    const {
      category,
      monthlyLimit,
      month,
    } = req.body;

    const budget = await Budget.create({
      user: req.user._id,
      category,
      monthlyLimit,
      month,
    });

    res.status(201).json({
      message: "Budget created successfully",
      budget,
    });

  } catch (error) {
    res.status(500).json({
      message: "Budget creation failed",
      error: error.message,
    });
  }
});

// UPDATE BUDGET
router.put("/:id", protect, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json({
      message: "Budget updated successfully",
      budget,
    });

  } catch (error) {
    res.status(500).json({
      message: "Budget update failed",
      error: error.message,
    });
  }
});

// DELETE BUDGET
router.delete("/:id", protect, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json({
      message: "Budget deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Budget deletion failed",
      error: error.message,
    });
  }
});

export default router;