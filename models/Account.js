import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    // Owner of the bank account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Bank reference
    // Optional because the current account creation UI
    // does not require selecting a bank.
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      index: true,
      default: null,
    },

    // Automatically generated bank account number
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Account type
    accountType: {
      type: String,
      enum: ["Savings", "Current", "Salary"],
      default: "Savings",
    },

    // -----------------------------
    // PERSONAL DETAILS
    // -----------------------------

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    // -----------------------------
    // ADDRESS
    // -----------------------------

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    // -----------------------------
    // KYC DETAILS
    // -----------------------------

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    aadhaarNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // -----------------------------
    // NOMINEE DETAILS
    // -----------------------------

    nomineeName: {
      type: String,
      trim: true,
      default: "",
    },

    nomineeRelationship: {
      type: String,
      trim: true,
      default: "",
    },

    nomineePhone: {
      type: String,
      trim: true,
      default: "",
    },

    // -----------------------------
    // ACCOUNT FINANCIAL DETAILS
    // -----------------------------

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    currency: {
      type: String,
      default: "INR",
    },

    // -----------------------------
    // BANK DETAILS
    // -----------------------------

    ifsc: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },

    upiId: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // -----------------------------
    // STATUS
    // -----------------------------

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

// Generate a unique 12-digit account number
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

// Generate a unique UPI ID
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

export default mongoose.model(
  "Account",
  accountSchema
);