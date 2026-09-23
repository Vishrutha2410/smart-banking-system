import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },

    transferType: {
      type: String,
      enum: [
        "UPI",
        "IMPS",
        "NEFT",
        "RTGS",
        "SELF",
      ],
      required: true,
    },

    recipientName: {
      type: String,
      trim: true,
      default: "",
    },

    recipientAccountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    recipientIfsc: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    recipientUpiId: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    referenceNumber: {
      type: String,
      unique: true,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Completed",
        "Failed",
      ],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

const Transfer = mongoose.model(
  "Transfer",
  transferSchema
);

export default Transfer;