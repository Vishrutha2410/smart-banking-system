import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional because the account creation form
    // currently does not ask the user to select a bank.
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: false,
      index: true,
      default: null,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    accountType: {
      type: String,
      enum: ["Savings", "Current", "Salary"],
      default: "Savings",
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Automatically generated during account creation.
    ifsc: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    upiId: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

// =====================================================
// GENERATE UNIQUE ACCOUNT NUMBER
// =====================================================

accountSchema.statics.generateAccountNumber =
  async function () {
    let accountNumber;
    let exists = true;

    while (exists) {
      accountNumber = String(
        Math.floor(
          100000000000 +
            Math.random() * 900000000000
        )
      );

      exists = await this.exists({
        accountNumber,
      });
    }

    return accountNumber;
  };

// =====================================================
// GENERATE UNIQUE UPI ID
// =====================================================

accountSchema.statics.generateUpiId =
  async function (user, preferredName) {
    const base =
      preferredName ||
      user?.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") ||
      "user";

    let upiId = `${base}@smartbank`;
    let counter = 1;

    while (await this.exists({ upiId })) {
      upiId = `${base}${counter}@smartbank`;
      counter += 1;
    }

    return upiId;
  };

// =====================================================
// GENERATE UNIQUE IFSC
// =====================================================
//
// IFSC format used by this project:
//
// 4-letter bank prefix
// +
// 0
// +
// 6-digit branch code
//
// Example:
// SMBK0123456
//
// If a real/project bank prefix is supplied,
// that prefix is used instead.
//
// =====================================================

accountSchema.statics.generateIfsc =
  async function (bankPrefix = "SMBK") {
    let prefix = String(bankPrefix || "SMBK")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4);

    // Make sure prefix is exactly 4 characters.
    if (prefix.length < 4) {
      prefix = prefix.padEnd(4, "X");
    }

    let ifsc;
    let exists = true;

    while (exists) {
      const branchCode = String(
        Math.floor(
          100000 +
            Math.random() * 900000
        )
      );

      ifsc = `${prefix}0${branchCode}`;

      exists = await this.exists({
        ifsc,
      });
    }

    return ifsc;
  };

export default mongoose.model(
  "Account",
  accountSchema
);