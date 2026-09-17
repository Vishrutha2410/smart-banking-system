import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
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
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Generates a unique 12-digit account number, e.g. 340192837465
accountSchema.statics.generateAccountNumber = async function () {
  const Account = this;
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = String(Math.floor(100000000000 + Math.random() * 900000000000));
    // eslint-disable-next-line no-await-in-loop
    exists = await Account.exists({ accountNumber });
  }

  return accountNumber;
};

export default mongoose.model("Account", accountSchema);
