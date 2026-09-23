import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Bank from "../models/Bank.js";

const banks = [
  {
    bankId: "SMARTBANK",
    bankName: "SmartBank",
    shortName: "SMART",
    ifscPrefix: "SMRT",
    status: "active",
  },
  {
    bankId: "SBI",
    bankName: "State Bank of India",
    shortName: "SBI",
    ifscPrefix: "SBIN",
    status: "active",
  },
  {
    bankId: "HDFC",
    bankName: "HDFC Bank",
    shortName: "HDFC",
    ifscPrefix: "HDFC",
    status: "active",
  },
  {
    bankId: "ICICI",
    bankName: "ICICI Bank",
    shortName: "ICICI",
    ifscPrefix: "ICIC",
    status: "active",
  },
  {
    bankId: "AXIS",
    bankName: "Axis Bank",
    shortName: "AXIS",
    ifscPrefix: "UTIB",
    status: "active",
  },
  {
    bankId: "BOB",
    bankName: "Bank of Baroda",
    shortName: "BOB",
    ifscPrefix: "BARB",
    status: "active",
  },
];

const seed = async () => {
  try {
    await connectDB();

    for (const bank of banks) {
      await Bank.findOneAndUpdate(
        { bankId: bank.bankId },
        bank,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("Banks seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Bank seeding failed:", error);
    process.exit(1);
  }
};

seed();