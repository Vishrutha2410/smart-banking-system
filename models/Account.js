import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Bank belonging to this account
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
      index: true,
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

    // Automatically generated based on selected bank
    ifsc: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    upiId: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // BASIC ACCOUNT HOLDER DETAILS
    // ==========================================

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      default: "",
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["", "Male", "Female", "Other"],
      default: "",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // KYC
    // ==========================================

    // PAN is OPTIONAL
    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    // Aadhaar is optional
    aadhaarNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // NOMINEE
    // ==========================================

    nomineeName: {
      type: String,
      default: "",
      trim: true,
    },

    nomineeRelationship: {
      type: String,
      default: "",
      trim: true,
    },

    nomineePhone: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // TRANSACTION PIN
    // ==========================================

    transactionPinHash: {
      type: String,
      default: "",
      select: false,
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// GENERATE UNIQUE ACCOUNT NUMBER
// ======================================================

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

// ======================================================
// GENERATE UNIQUE UPI ID
// ======================================================

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

// ======================================================
// GENERATE UNIQUE IFSC
// ======================================================

accountSchema.statics.generateIfsc =
  async function (bankPrefix = "SMBK") {
    let prefix = String(bankPrefix || "SMBK")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4);

    if (prefix.length !== 4) {
      prefix = "SMBK";
    }

    let ifsc;
    let exists = true;

    while (exists) {
      const branchCode = Math.floor(
        100000 + Math.random() * 900000
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