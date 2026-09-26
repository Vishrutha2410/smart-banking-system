import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional for now because the account creation form
    // does not ask the user to select a bank.
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
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

    // Optional because the current account creation
    // form does not ask for a bank/IFSC.
    ifsc: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    upiId: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // -----------------------------
    // KYC DETAILS
    // -----------------------------

    // PAN is OPTIONAL
    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    // Aadhaar is kept optional as well.
    aadhaarNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // -----------------------------
    // NOMINEE DETAILS
    // -----------------------------

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
    // transaction pin
    transactionPinHash: {
  type: String,
  default: "",
  select: false,
},
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

// --------------------------------------
// Generate unique account number
// --------------------------------------
accountSchema.statics.generateAccountNumber = async function () {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = String(
      Math.floor(100000000000 + Math.random() * 900000000000)
    );

    exists = await this.exists({ accountNumber });
  }

  return accountNumber;
};

// --------------------------------------
// Generate unique UPI ID
// --------------------------------------
accountSchema.statics.generateUpiId = async function (
  user,
  preferredName
) {
  const base =
    preferredName ||
    user?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "user";

  let upiId = `${base}@smartbank`;

  let counter = 1;

  while (await this.exists({ upiId })) {
    upiId = `${base}${counter}@smartbank`;
    counter += 1;
  }

  return upiId;
};

export default mongoose.model("Account", accountSchema);