import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
      unique: true,
    },
    cardType: {
      type: String,
      enum: ["Debit", "Credit"],
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "requested"],
      default: "requested",
    },
    spendingLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },
    availableLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },
  },
  { timestamps: true }
);

cardSchema.statics.generateCardNumber = async function () {
  const Card = this;
  let cardNumber;
  let exists = true;

  while (exists) {
    cardNumber = Array.from({ length: 4 }, () =>
      String(Math.floor(1000 + Math.random() * 9000))
    ).join("");
    // eslint-disable-next-line no-await-in-loop
    exists = await Card.exists({ cardNumber });
  }

  return cardNumber;
};

cardSchema.methods.maskedNumber = function () {
  return `**** **** **** ${this.cardNumber.slice(-4)}`;
};

export default mongoose.model("Card", cardSchema);
