import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const CustomerTypeRoute = ({
  allowed = [],
}) => {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
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

  // Admin users do not use customer-type
  // restrictions.
  if (user?.role === "admin") {
    return <Outlet />;
  }

  const customerType =
    user?.customerType ||
    "personal";

  if (
    allowed.length > 0 &&
    !allowed.includes(customerType)
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