import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    collegeName: {
      type: String,
      required: [true, "College or university name is required"],
      trim: true,
      maxlength: 200,
    },

    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
      maxlength: 100,
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      maxlength: 150,
    },

    department: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    yearOfStudy: {
      type: String,
      required: [true, "Year of study is required"],
      enum: [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Final Year",
        "Other",
      ],
    },

    graduationYear: {
      type: Number,
      default: null,
      min: 2000,
      max: 2100,
    },

    monthlyAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    savingsGoalName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    savingsGoalTarget: {
      type: Number,
      default: 0,
      min: 0,
    },

    profileCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "StudentProfile",
  studentProfileSchema
);