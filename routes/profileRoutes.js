import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// @route GET /api/profile
// Alias of /api/auth/me, kept separate to match the spec's dedicated profile resource.
router.get("/", async (req, res) => {
  res.status(200).json({ user: req.user.toSafeObject() });
});

// @route PUT /api/profile
router.put("/", async (req, res, next) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      req.user.name = name.trim();
    }
    if (phone !== undefined) req.user.phone = phone;
    if (address !== undefined) req.user.address = address;
    if (profileImage !== undefined) req.user.profileImage = profileImage;

    await req.user.save();

    res.status(200).json({ user: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

export default router;
