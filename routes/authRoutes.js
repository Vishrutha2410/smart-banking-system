import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// @route  POST /api/auth/register
// body: { name, email, phone, password, confirmPassword, role, adminCode }
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, role, adminCode } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Name, email, password and confirmPassword are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const requestedRole = role === "admin" ? "admin" : "member";

    // Admin registration requires a valid code known only server-side.
    // A user can never simply flip a "role" field to become admin.
    if (requestedRole === "admin") {
      if (!adminCode || adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(403).json({ message: "Invalid admin registration code." });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      password,
      role: requestedRole,
    });

    // Members automatically get a default Savings account with 0 balance.
    // Admins manage the platform and don't need a personal banking account,
    // but we still create one so an admin can also use the app as a member if desired.
    const accountNumber = await Account.generateAccountNumber();
    const account = await Account.create({
      user: user._id,
      accountNumber,
      accountType: "Savings",
      balance: 0,
      status: "active",
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.toSafeObject(),
      defaultAccount: account,
    });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/auth/login
// body: { email, password, role }  -- role is "Login As" selection, verified against DB
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated. Contact support." });
    }

    // The frontend "Login As" selector is never trusted on its own -
    // it must match the role actually stored in MongoDB for this user.
    if (role && role !== user.role) {
      return res.status(403).json({ message: "Invalid role for this account." });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
});

// @route  GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.status(200).json({ user: req.user.toSafeObject() });
});

// @route  PUT /api/auth/profile
router.put("/profile", protect, async (req, res, next) => {
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

// @route  PUT /api/auth/password
router.put("/password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "currentPassword, newPassword and confirmPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const matches = await user.comparePassword(currentPassword);

    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
