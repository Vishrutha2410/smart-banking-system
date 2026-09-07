import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },

    accountType: {
      type: String,
      enum: [
        "Savings",
        "Current",
        "Salary",
      ],
      default: "Savings",
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Blocked",
      ],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model(
  "Account",
  accountSchema
);

export default Account;