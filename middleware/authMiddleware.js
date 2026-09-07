import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Token not found
    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Please login first.",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user and exclude password
    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    // Store logged-in user details
    req.user = user;

    // Continue to next route
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};