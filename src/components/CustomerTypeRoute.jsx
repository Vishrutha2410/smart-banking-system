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

  const customerType =
    user?.customerType ||
    "personal";

  if (
    !allowedTypes.includes(
      customerType
    )
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