import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: 200,
    },

    businessType: {
      type: String,
      required: [true, "Business type is required"],
      enum: [
        "Sole Proprietorship",
        "Partnership",
        "Private Limited",
        "Public Limited",
        "LLP",
        "Startup",
        "Other",
      ],
    },

    registrationNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    gstNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },

    panNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    industry: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    businessAddress: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    annualTurnover: {
      type: Number,
      min: 0,
      default: 0,
    },

    employeeCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },

    businessPhone: {
      type: String,
      trim: true,
      default: "",
    },

    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "BusinessProfile",
  businessProfileSchema
);