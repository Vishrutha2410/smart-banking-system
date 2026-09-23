import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

    ifsc: {
      type: String,
      required: true,
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

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

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

accountSchema.statics.generateUpiId = async function (user, preferredName) {
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