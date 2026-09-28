export const requireCustomerType = (
  ...allowedTypes
) => {
  return (req, res, next) => {
    const customerType =
      req.user?.customerType || "personal";

    if (!allowedTypes.includes(customerType)) {
      return res.status(403).json({
        message:
          "This feature is not available for your customer type.",
      });
    }

    next();
  };
};

export const studentOnly = requireCustomerType(
  "student"
);

export const personalOnly = requireCustomerType(
  "personal"
);

export const businessOnly = requireCustomerType(
  "business"
);