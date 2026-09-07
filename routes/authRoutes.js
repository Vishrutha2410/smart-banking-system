import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = String(
      Math.floor(
        100000000000 +
        Math.random() * 900000000000
      )
    );

    const account = await Account.findOne({
      accountNumber,
    });

    exists = !!account;
  }

  return accountNumber;
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    const accountNumber = await generateAccountNumber();

const account = await Account.create({
  user: user._id,
  accountNumber,
  accountType: "Savings",
  balance: 0,
  currency: "INR",
});

    const token = generateToken(user._id);

    res.status(201).json({
  message: "Registration successful",
  token,

  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  },

  account: {
    id: account._id,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    currency: account.currency,
  },
});

  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordCorrect = await user.matchPassword(password);

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

export default router;