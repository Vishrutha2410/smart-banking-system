import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    cardNumber: {
      type: String,
      required: true,
    },

    cardType: {
      type: String,
      enum: [
        "Debit",
        "Credit",
      ],
      default: "Debit",
    },

    cardHolderName: {
      type: String,
      required: true,
      trim: true,
    },

    expiryDate: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Blocked",
        "Expired",
      ],
      default: "Active",
    },

    spendingLimit: {
      type: Number,
      default: 50000,
    },
  },
  {
    timestamps: true,
  }
);

const Card = mongoose.model(
  "Card",
  cardSchema
);

export default Card;