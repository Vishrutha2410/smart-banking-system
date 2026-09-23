import express from "express";

import Bank from "../models/Bank.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const banks = await Bank.find({
      status: "active",
    }).sort({ bankName: 1 });

    res.json({ banks });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  protect,
  adminOnly,
  async (req, res, next) => {
    try {
      const bank = await Bank.create(req.body);

      res.status(201).json({ bank });
    } catch (error) {
      next(error);
    }
  }
);

export default router;