import express from "express";

import StudentProfile from "../models/StudentProfile.js";

import { protect } from "../middleware/authMiddleware.js";
import { studentOnly } from "../middleware/customerTypeMiddleware.js";

const router = express.Router();

// ======================================================
// GET STUDENT PROFILE
// GET /api/student/profile
// ======================================================

router.get(
  "/profile",
  protect,
  studentOnly,
  async (req, res, next) => {
    try {
      let profile =
        await StudentProfile.findOne({
          user: req.user._id,
        });

      if (!profile) {
        profile = await StudentProfile.create({
          user: req.user._id,

          collegeName: "Not provided",

          studentId: "Not provided",

          course: "Not provided",

          yearOfStudy: "Other",

          profileCompleted: false,
        });
      }

      res.status(200).json({
        profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// UPDATE STUDENT PROFILE
// PUT /api/student/profile
// ======================================================

router.put(
  "/profile",
  protect,
  studentOnly,
  async (req, res, next) => {
    try {
      const {
        collegeName,
        studentId,
        course,
        department,
        yearOfStudy,
        graduationYear,
        monthlyAllowance,
        savingsGoalName,
        savingsGoalTarget,
      } = req.body;

      if (!collegeName?.trim()) {
        return res.status(400).json({
          message:
            "College or university name is required.",
        });
      }

      if (!studentId?.trim()) {
        return res.status(400).json({
          message: "Student ID is required.",
        });
      }

      if (!course?.trim()) {
        return res.status(400).json({
          message: "Course is required.",
        });
      }

      const validYears = [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Final Year",
        "Other",
      ];

      if (!validYears.includes(yearOfStudy)) {
        return res.status(400).json({
          message: "Please select a valid year of study.",
        });
      }

      const allowance =
        Number(monthlyAllowance || 0);

      const savingsTarget =
        Number(savingsGoalTarget || 0);

      if (
        Number.isNaN(allowance) ||
        allowance < 0
      ) {
        return res.status(400).json({
          message:
            "Monthly allowance must be a valid non-negative amount.",
        });
      }

      if (
        Number.isNaN(savingsTarget) ||
        savingsTarget < 0
      ) {
        return res.status(400).json({
          message:
            "Savings goal target must be a valid non-negative amount.",
        });
      }

      let profile =
        await StudentProfile.findOne({
          user: req.user._id,
        });

      if (!profile) {
        profile =
          new StudentProfile({
            user: req.user._id,
          });
      }

      profile.collegeName =
        collegeName.trim();

      profile.studentId =
        studentId.trim();

      profile.course =
        course.trim();

      profile.department =
        department?.trim() || "";

      profile.yearOfStudy =
        yearOfStudy;

      profile.graduationYear =
        graduationYear
          ? Number(graduationYear)
          : null;

      profile.monthlyAllowance =
        allowance;

      profile.savingsGoalName =
        savingsGoalName?.trim() || "";

      profile.savingsGoalTarget =
        savingsTarget;

      profile.profileCompleted = true;

      await profile.save();

      res.status(200).json({
        message:
          "Student profile updated successfully.",
        profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;