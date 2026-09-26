import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Card from "../models/Card.js";
import Account from "../models/Account.js";
import User from "../models/User.js";

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

/*
 * =========================================================
 * GET ALL CARDS
 * =========================================================
 */

router.get("/", async (req, res, next) => {
  try {
    const cards = await Card.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      cards: cards.map(serializeCard),
    });
  } catch (error) {
    next(error);
  }
});

/*
 * =========================================================
 * REQUEST / CREATE CARD
 * =========================================================
 */

router.post("/", async (req, res, next) => {
  try {
    const {
      accountId,
      cardType,
      spendingLimit,
    } = req.body;

    if (
      !accountId ||
      !mongoose.isValidObjectId(accountId)
    ) {
      return res.status(400).json({
        message:
          "Valid accountId is required",
      });
    }

    if (
      !cardType ||
      !["Debit", "Credit"].includes(cardType)
    ) {
      return res.status(400).json({
        message:
          "cardType must be 'Debit' or 'Credit'",
      });
    }

    const account =
      await Account.findOne({
        _id: accountId,
        user: req.user._id,
      });

    if (!account) {
      return res.status(404).json({
        message:
          "Account not found or not owned by you",
      });
    }

    const cardNumber =
      await Card.generateCardNumber();

    const expiryDate = new Date();

    expiryDate.setFullYear(
      expiryDate.getFullYear() + 4
    );

    const limit =
      Number(spendingLimit) > 0
        ? Number(spendingLimit)
        : 50000;

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

    res.status(201).json({
      card: serializeCard(card),
    });
  } catch (error) {
    next(error);
  }
});

/*
 * =========================================================
 * UPDATE CARD STATUS
 * =========================================================
 *
 * Activation:
 *
 * status = active
 * pin = 4 digits
 * confirmPin = same 4 digits
 *
 * The PIN is stored as a bcrypt hash.
 *
 * If the user already has a transaction PIN,
 * activating another card does not replace it.
 */

router.put(
  "/:id/status",
  async (req, res, next) => {
    try {
      const {
        status,
        pin,
        confirmPin,
      } = req.body;

      if (
        !["active", "blocked", "requested"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid card id",
        });
      }

      const card =
        await Card.findOne({
          _id: req.params.id,
          user: req.user._id,
        });

      if (!card) {
        return res.status(404).json({
          message: "Card not found",
        });
      }

      /*
       * =====================================================
       * FIRST CARD ACTIVATION
       * =====================================================
       *
       * A transaction PIN is required when the card
       * is activated for the first time.
       */

      if (
        status === "active" &&
        card.status === "requested"
      ) {
        if (!pin) {
          return res.status(400).json({
            message:
              "Transaction PIN is required to activate the card.",
          });
        }

        if (!/^\d{4}$/.test(pin)) {
          return res.status(400).json({
            message:
              "Transaction PIN must contain exactly 4 digits.",
          });
        }

        if (pin !== confirmPin) {
          return res.status(400).json({
            message:
              "Transaction PINs do not match.",
          });
        }

        /*
         * Get user with transactionPin.
         */
        const user =
          await User.findById(
            req.user._id
          ).select(
            "+transactionPin"
          );

        if (!user) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        /*
         * Only create the PIN if one has not
         * already been created.
         */
        if (!user.pinSet) {
          const hashedPin =
            await bcrypt.hash(
              pin,
              10
            );

          user.transactionPin =
            hashedPin;

          user.pinSet = true;

          await user.save();
        }
      }

      /*
       * Update card status.
       */
      card.status = status;

      await card.save();

      await notify(
        req.user._id,
        "Card Status Updated",
        `Your card ending in ${card.cardNumber.slice(
          -4
        )} is now ${status}.`,
        "account"
      );

      res.status(200).json({
        card: serializeCard(card),
        pinSet:
          status === "active"
            ? true
            : undefined,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;