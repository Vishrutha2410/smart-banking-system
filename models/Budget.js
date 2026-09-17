import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyLimit: {
      type: Number,
      required: true,
      min: [1, "Monthly limit must be greater than zero"],
    },
    month: {
      // 1-12
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// One budget per user/category/month/year
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
