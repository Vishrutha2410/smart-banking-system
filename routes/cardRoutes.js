import express from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();
router.use(protect);

const serializeCard = (card) => ({
  _id: card._id,
  account: card.account,
  cardType: card.cardType,
  maskedNumber: card.maskedNumber(),
  expiryDate: card.expiryDate,
  status: card.status,
  spendingLimit: card.spendingLimit,
  availableLimit: card.availableLimit,
  createdAt: card.createdAt,
});

// @route GET /api/cards
router.get("/", async (req, res, next) => {
  try {
    const cards = await Card.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ cards: cards.map(serializeCard) });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/cards  (Request/Create a card)
// body: { accountId, cardType, spendingLimit }
router.post("/", async (req, res, next) => {
  try {
    const { accountId, cardType, spendingLimit } = req.body;

    if (!accountId || !mongoose.isValidObjectId(accountId)) {
      return res.status(400).json({ message: "Valid accountId is required" });
    }
    if (!cardType || !["Debit", "Credit"].includes(cardType)) {
      return res.status(400).json({ message: "cardType must be 'Debit' or 'Credit'" });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found or not owned by you" });
    }

    const cardNumber = await Card.generateCardNumber();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    const limit = Number(spendingLimit) > 0 ? Number(spendingLimit) : 50000;

    const card = await Card.create({
      user: req.user._id,
      account: account._id,
      cardNumber,
      cardType,
      expiryDate,
      status: "requested",
      spendingLimit: limit,
      availableLimit: limit,
    });

    await notify(
      req.user._id,
      "Card Requested",
      `Your ${cardType} card request has been submitted and is pending activation.`,
      "account"
    );

    res.status(201).json({ card: serializeCard(card) });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/cards/:id/status
// body: { status: "active" | "blocked" }
router.put("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "blocked", "requested"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid card id" });
    }

    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.status = status;
    await card.save();

    await notify(
      req.user._id,
      "Card Status Updated",
      `Your card ending in ${card.cardNumber.slice(-4)} is now ${status}.`,
      "account"
    );

    res.status(200).json({ card: serializeCard(card) });
  } catch (error) {
    next(error);
  }
});

export default router;
