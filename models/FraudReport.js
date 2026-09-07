import mongoose from "mongoose";

const fraudReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
      ],
      default: "Low",
    },

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Safe",
        "Under Review",
        "Blocked",
      ],
      default: "Safe",
    },
  },
  {
    timestamps: true,
  }
);

const FraudReport = mongoose.model(
  "FraudReport",
  fraudReportSchema
);

export default FraudReport;