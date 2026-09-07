export const adminOnly = (req, res, next) => {
  try {
    // Check if user exists and is an admin
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized. Please login first.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin access required.",
      });
    }

    // User is admin
    next();

  } catch (error) {
    return res.status(500).json({
      message: "Admin authorization failed.",
      error: error.message,
    });
  }
};