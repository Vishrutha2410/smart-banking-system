import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// CONSTANTS
// ======================================================

const CUSTOMER_TYPES = [
  "personal",
  "student",
  "business",
];

// ======================================================
// GENERATE JWT TOKEN
// ======================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      customerType:
        user.customerType || "personal",
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// ======================================================
// VALIDATE EMAIL
// ======================================================

const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// ======================================================
// NORMALIZE CUSTOMER TYPE
// ======================================================

const normalizeCustomerType = (
  customerType
) => {
  const value = String(
    customerType || "personal"
  )
    .trim()
    .toLowerCase();

  return CUSTOMER_TYPES.includes(value)
    ? value
    : null;
};

// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post(
  "/register",
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        adminCode,
        customerType,
      } = req.body;

      // --------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------

      if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message:
            "Name, email, password and confirmPassword are required",
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message:
            "Please provide a valid email address",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match",
        });
      }

      // --------------------------------------------------
      // ROLE
      // --------------------------------------------------

      const requestedRole =
        role === "admin"
          ? "admin"
          : "member";

      // --------------------------------------------------
      // CUSTOMER TYPE
      //
      // Admin does not need a customer type.
      // We still store personal for consistency.
      // --------------------------------------------------

      let requestedCustomerType =
        "personal";

      if (requestedRole === "member") {
        const normalizedCustomerType =
          normalizeCustomerType(
            customerType
          );

        if (!normalizedCustomerType) {
          return res.status(400).json({
            message:
              "Please select a valid customer type: personal, student or business.",
          });
        }

        requestedCustomerType =
          normalizedCustomerType;
      }

      // --------------------------------------------------
      // ADMIN REGISTRATION VALIDATION
      // --------------------------------------------------

      if (requestedRole === "admin") {
        if (
          !adminCode ||
          adminCode !==
            process.env.ADMIN_REGISTRATION_CODE
        ) {
          return res.status(403).json({
            message:
              "Invalid admin registration code.",
          });
        }
      }

      // --------------------------------------------------
      // CHECK EXISTING USER
      // --------------------------------------------------

      const normalizedEmail = email
        .toLowerCase()
        .trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "An account with this email already exists",
        });
      }

      // --------------------------------------------------
      // CREATE USER
      // --------------------------------------------------

      const user = await User.create({
        name: name.trim(),

        email: normalizedEmail,

        phone: phone || "",

        password,

        role: requestedRole,

        customerType:
          requestedCustomerType,
      });

      // --------------------------------------------------
      // GENERATE TOKEN
      // --------------------------------------------------

      const token = generateToken(user);

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(201).json({
        message:
          "Registration successful. You can now login.",

        token,

        user: user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post(
  "/login",
  async (req, res, next) => {
    try {
      const {
        email,
        password,
        role,
      } = req.body;

      // --------------------------------------------------
      // VALIDATION
      // --------------------------------------------------

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      // --------------------------------------------------
      // FIND USER
      // --------------------------------------------------

      const user =
        await User.findOne({
          email: email
            .toLowerCase()
            .trim(),
        }).select(
          "+password"
        );

      if (
        !user ||
        !(await user.comparePassword(
          password
        ))
      ) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // --------------------------------------------------
      // ACTIVE CHECK
      // --------------------------------------------------

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "This account has been deactivated. Contact support.",
        });
      }

      // --------------------------------------------------
      // ROLE CHECK
      // --------------------------------------------------

      if (
        role &&
        role !== user.role
      ) {
        return res.status(403).json({
          message:
            "Invalid role for this account.",
        });
      }

      // --------------------------------------------------
      // OLD USERS
      //
      // Existing MongoDB users may not have customerType.
      // Treat them as personal.
      // --------------------------------------------------

      if (!user.customerType) {
        user.customerType =
          "personal";

        await user.save();
      }

      // --------------------------------------------------
      // TOKEN
      // --------------------------------------------------

      const token =
        generateToken(user);

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        token,

        user: user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  protect,
  async (req, res) => {
    // Backward compatibility for old users
    if (!req.user.customerType) {
      req.user.customerType =
        "personal";

      await req.user.save();
    }

    return res.status(200).json({
      user: req.user.toSafeObject(),
    });
  }
);

// ======================================================
// UPDATE PROFILE
// PUT /api/auth/profile
// ======================================================

router.put(
  "/profile",
  protect,
  async (req, res, next) => {
    try {
      const {
        name,
        phone,
        address,
        profileImage,
      } = req.body;

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({
            message:
              "Name cannot be empty",
          });
        }

        req.user.name =
          name.trim();
      }

      if (phone !== undefined) {
        req.user.phone = phone;
      }

      if (address !== undefined) {
        req.user.address =
          address;
      }

      if (
        profileImage !== undefined
      ) {
        req.user.profileImage =
          profileImage;
      }

      await req.user.save();

      return res.status(200).json({
        user:
          req.user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// CHANGE PASSWORD
// PUT /api/auth/password
// ======================================================

router.put(
  "/password",
  protect,
  async (req, res, next) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message:
            "currentPassword, newPassword and confirmPassword are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message:
            "New password must be at least 6 characters",
        });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          message:
            "New password and confirmation do not match",
        });
      }

      const user =
        await User.findById(
          req.user._id
        ).select("+password");

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const matches =
        await user.comparePassword(
          currentPassword
        );

      if (!matches) {
        return res.status(401).json({
          message:
            "Current password is incorrect",
        });
      }

      user.password =
        newPassword;

      await user.save();

      return res.status(200).json({
        message:
          "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;