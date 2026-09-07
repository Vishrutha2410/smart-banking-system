import express from "express";
import Card from "../models/Card.js";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL CARDS
router.get("/", protect, async (req, res) => {
  try {
    const cards = await Card.find({
      user: req.user._id,
    })
      .populate("account", "accountNumber accountType");

    res.json(cards);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch cards",
      error: error.message,
    });
  }
});

// CREATE CARD
router.post("/", protect, async (req, res) => {
  try {
    const {
      account,
      cardType,
      cardHolderName,
      expiryDate,
      spendingLimit,
    } = req.body;

    const userAccount = await Account.findOne({
      _id: account,
      user: req.user._id,
    });

    if (!userAccount) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Demo card number
    const cardNumber =
      `4${Math.floor(
        100000000000000 +
        Math.random() *
        900000000000000
      )}`;

    const card = await Card.create({
      user: req.user._id,
      account,
      cardNumber,
      cardType: cardType || "Debit",
      cardHolderName,
      expiryDate,
      spendingLimit: spendingLimit || 50000,
    });

    res.status(201).json({
      message: "Card created successfully",
      card,
    });

  } catch (error) {
    res.status(500).json({
      message: "Card creation failed",
      error: error.message,
    });
  }
});

// BLOCK CARD
router.put("/:id/block", protect, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        status: "Blocked",
      },
      {
        new: true,
      }
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    res.json({
      message: "Card blocked successfully",
      card,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to block card",
      error: error.message,
    });
  }
});

// UNBLOCK CARD
router.put("/:id/unblock", protect, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        status: "Active",
      },
      {
        new: true,
      }
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    res.json({
      message: "Card activated successfully",
      card,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to activate card",
      error: error.message,
    });
  }
});

export default router;