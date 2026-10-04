import express from "express";

import BusinessProfile from "../models/BusinessProfile.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// --------------------------------------------------
// BUSINESS CUSTOMER CHECK
// --------------------------------------------------

const requireBusinessCustomer = (req, res, next) => {
  if (
    req.user.role !== "member" ||
    req.user.customerType !== "business"
  ) {
    return res.status(403).json({
      message: "Business customer access required.",
    });
  }

  next();
};

router.use(requireBusinessCustomer);

// --------------------------------------------------
// GET BUSINESS PROFILE
// GET /api/business/profile
// --------------------------------------------------

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findOne({
      user: req.user._id,
    });

    res.status(200).json({
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// CREATE / UPDATE BUSINESS PROFILE
// PUT /api/business/profile
// --------------------------------------------------

router.put("/profile", async (req, res, next) => {
  try {
    const {
      businessName,
      businessType,
      registrationNumber,
      gstNumber,
      panNumber,
      industry,
      businessAddress,
      city,
      state,
      pincode,
      annualTurnover,
      employeeCount,
      contactPerson,
      businessPhone,
      businessEmail,
    } = req.body;

    if (!businessName?.trim()) {
      return res.status(400).json({
        message: "Business name is required.",
      });
    }

    if (!businessType) {
      return res.status(400).json({
        message: "Business type is required.",
      });
    }

    const profile =
      await BusinessProfile.findOneAndUpdate(
        {
          user: req.user._id,
        },
        {
          user: req.user._id,
          businessName: businessName.trim(),
          businessType,
          registrationNumber:
            registrationNumber?.trim() || "",
          gstNumber: gstNumber?.trim() || "",
          panNumber: panNumber?.trim() || "",
          industry: industry?.trim() || "",
          businessAddress:
            businessAddress?.trim() || "",
          city: city?.trim() || "",
          state: state?.trim() || "",
          pincode: pincode?.trim() || "",
          annualTurnover:
            Number(annualTurnover || 0),
          employeeCount:
            Number(employeeCount || 0),
          contactPerson:
            contactPerson?.trim() || "",
          businessPhone:
            businessPhone?.trim() || "",
          businessEmail:
            businessEmail?.trim().toLowerCase() || "",
          profileCompleted: true,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      message:
        "Business profile updated successfully.",
      profile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;