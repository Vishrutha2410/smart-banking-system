import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    ifsc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    nickname: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

beneficiarySchema.index({
  user: 1,
  accountNumber: 1,
});

export default mongoose.model("Beneficiary", beneficiarySchema);