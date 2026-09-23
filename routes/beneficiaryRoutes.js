import express from "express";
import mongoose from "mongoose";

import Beneficiary from "../models/Beneficiary.js";
import Bank from "../models/Bank.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const beneficiaries =
      await Beneficiary.find({
        user: req.user._id,
      })
        .populate("bank", "bankName shortName")
        .sort({ createdAt: -1 });

    res.json({ beneficiaries });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      bankId,
      accountNumber,
      ifsc,
      nickname,
    } = req.body;

    if (
      !name ||
      !bankId ||
      !accountNumber ||
      !ifsc
    ) {
      return res.status(400).json({
        message:
          "Name, bank, account number and IFSC are required.",
      });
    }

    const bank = await Bank.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(bankId) ? bankId : null },
        { bankId },
      ],
    });

    if (!bank) {
      return res.status(404).json({
        message: "Bank not found.",
      });
    }

    const beneficiary =
      await Beneficiary.create({
        user: req.user._id,
        name,
        bank: bank._id,
        accountNumber,
        ifsc,
        nickname: nickname || "",
      });

    res.status(201).json({
      beneficiary,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid beneficiary ID.",
      });
    }

    const beneficiary =
      await Beneficiary.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiary not found.",
      });
    }

    const {
      name,
      bankId,
      accountNumber,
      ifsc,
      nickname,
    } = req.body;

    if (name !== undefined)
      beneficiary.name = name;

    if (accountNumber !== undefined)
      beneficiary.accountNumber =
        accountNumber;

    if (ifsc !== undefined)
      beneficiary.ifsc = ifsc.toUpperCase();

    if (nickname !== undefined)
      beneficiary.nickname = nickname;

    if (bankId) {
      const bank = await Bank.findOne({
        $or: [
          {
            _id: mongoose.isValidObjectId(bankId)
              ? bankId
              : null,
          },
          { bankId },
        ],
      });

      if (!bank) {
        return res.status(404).json({
          message: "Bank not found.",
        });
      }

      beneficiary.bank = bank._id;
    }

    await beneficiary.save();

    res.json({ beneficiary });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const beneficiary =
      await Beneficiary.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiary not found.",
      });
    }

    res.json({
      message: "Beneficiary deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;