import express from "express";

import {
  getTransfers,
  createTransfer,
  getTransferById,
} from "../controllers/transferController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * All transfer routes require authentication
 */

router.use(authMiddleware);


/*
 * GET
 * /api/transfers
 *
 * Get current user's transfer history
 */
router.get(
  "/",
  getTransfers
);


/*
 * POST
 * /api/transfers
 *
 * Create transfer
 */
router.post(
  "/",
  createTransfer
);


/*
 * GET
 * /api/transfers/:id
 *
 * Get single transfer
 */
router.get(
  "/:id",
  getTransferById
);


export default router;