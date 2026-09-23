import express from "express";
import {
  getTransfers,
  createTransfer,
  getTransferById,
} from "../controllers/transferController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All transfer routes require authentication
router.use(protect);

// Get current user's transfers
router.get("/", getTransfers);

// Create a new transfer
router.post("/", createTransfer);

// Get a single transfer
router.get("/:id", getTransferById);

export default router;