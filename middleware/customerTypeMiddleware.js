const normalizeCustomerType = (
  customerType
) => {
  return String(
    customerType || "personal"
  )
    .trim()
    .toLowerCase();
};

export const requireCustomerType = (
  ...allowedTypes
) => {
  return (req, res, next) => {
    const currentType =
      normalizeCustomerType(
        req.user?.customerType
      );

    const allowed =
      allowedTypes.map(
        normalizeCustomerType
      );

    if (!allowed.includes(currentType)) {
      return res.status(403).json({
        message:
          "This feature is not available for your customer type.",
        customerType:
          currentType,
        allowedCustomerTypes:
          allowed,
      });
    }

    next();
  };
};

export const getCustomerType =
  (req) => {
    return normalizeCustomerType(
      req.user?.customerType
    );
  };