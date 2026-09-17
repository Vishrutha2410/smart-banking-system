import express from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// @route GET /api/notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = true;
    await notification.save();
    res.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/notifications/read-all
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

export default router;
