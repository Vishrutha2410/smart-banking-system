// Must be used AFTER `protect` so req.user is populated.
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: admin access required" });
};
