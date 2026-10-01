import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CustomerTypeRoute = ({
  allowedTypes = [],
}) => {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const customerType = String(
    user?.customerType || "personal"
  )
    .trim()
    .toLowerCase();

  const normalizedAllowedTypes =
    Array.isArray(allowedTypes)
      ? allowedTypes.map((type) =>
          String(type).trim().toLowerCase()
        )
      : [];

  if (
    normalizedAllowedTypes.length === 0 ||
    !normalizedAllowedTypes.includes(customerType)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
};

export default CustomerTypeRoute;