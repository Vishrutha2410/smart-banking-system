import express from "express";

import {
  getTransfers,
  createTransfer,
  getTransferById,
} from "../controllers/transferController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * All transfer routes require authentication.
 */
router.use(protect);

/*
 * GET /api/transfers
 *
 * Get transfers belonging to
 * the logged-in user.
 */
router.get(
  "/",
  getTransfers
);

/*
 * POST /api/transfers
 *
 * Create a new fund transfer.
 */
router.post(
  "/",
  createTransfer
);

/*
 * GET /api/transfers/:id
 *
 * Get one transfer.
 */
router.get(
  "/:id",
  getTransferById
);

export default router;