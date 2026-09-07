import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    monthlyLimit: {
      type: Number,
      required: true,
      min: 0,
    },

    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    month: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Budget = mongoose.model(
  "Budget",
  budgetSchema
);

export default Budget;