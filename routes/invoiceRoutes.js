import express from "express";

import Invoice from "../models/Invoice.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

const requireBusinessCustomer = (
  req,
  res,
  next
) => {
  if (
    req.user.role !== "member" ||
    req.user.customerType !== "business"
  ) {
    return res.status(403).json({
      message:
        "Invoice management is available only for business customers.",
    });
  }

  next();
};

router.use(requireBusinessCustomer);

// --------------------------------------------------
// GET INVOICES
// --------------------------------------------------

router.get("/", async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      invoices,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// CREATE INVOICE
// --------------------------------------------------

router.post("/", async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      tax,
      dueDate,
      notes,
    } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({
        message: "Customer name is required.",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one invoice item is required.",
      });
    }

    const normalizedItems = items.map(
      (item) => {
        const quantity =
          Number(item.quantity);

        const price =
          Number(item.price);

        return {
          name:
            String(item.name || "").trim(),

          quantity,

          price,

          total:
            quantity * price,
        };
      }
    );

    const invalidItem =
      normalizedItems.some(
        (item) =>
          !item.name ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.price) ||
          item.price < 0
      );

    if (invalidItem) {
      return res.status(400).json({
        message:
          "Invoice contains invalid items.",
      });
    }

    const subtotal =
      normalizedItems.reduce(
        (sum, item) =>
          sum + item.total,
        0
      );

    const taxAmount =
      Number(tax || 0);

    if (
      !Number.isFinite(taxAmount) ||
      taxAmount < 0
    ) {
      return res.status(400).json({
        message: "Invalid tax amount.",
      });
    }

    const total =
      subtotal + taxAmount;

    const invoiceNumber =
      `INV-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const invoice =
      await Invoice.create({
        user: req.user._id,
        invoiceNumber,
        customerName:
          customerName.trim(),
        customerEmail:
          customerEmail
            ?.trim()
            .toLowerCase() || "",
        customerPhone:
          customerPhone?.trim() || "",
        items: normalizedItems,
        subtotal,
        tax: taxAmount,
        total,
        dueDate,
        notes:
          notes?.trim() || "",
      });

    res.status(201).json({
      message:
        "Invoice created successfully.",
      invoice,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// MARK INVOICE AS PAID
// --------------------------------------------------

router.put(
  "/:id/paid",
  async (req, res, next) => {
    try {
      const invoice =
        await Invoice.findOne({
          _id: req.params.id,
          user: req.user._id,
        });

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found.",
        });
      }

      invoice.status = "PAID";

      await invoice.save();

      res.json({
        message:
          "Invoice marked as paid.",
        invoice,
      });
    } catch (error) {
      next(error);
    }
  }
);

// --------------------------------------------------
// CANCEL INVOICE
// --------------------------------------------------

router.put(
  "/:id/cancel",
  async (req, res, next) => {
    try {
      const invoice =
        await Invoice.findOne({
          _id: req.params.id,
          user: req.user._id,
        });

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found.",
        });
      }

      invoice.status = "CANCELLED";

      await invoice.save();

      res.json({
        message:
          "Invoice cancelled.",
        invoice,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;