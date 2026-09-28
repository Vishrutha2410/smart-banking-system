import { useAuth } from "../context/AuthContext";

import Dashboard from "./Dashboard";
import StudentDashboard from "./StudentDashboard";
import BusinessDashboard from "./BusinessDashboard";

const CustomerDashboard = () => {
  const { user } = useAuth();

  const customerType =
    user?.customerType ||
    "personal";

  if (
    customerType ===
    "student"
  ) {
    return (
      <StudentDashboard />
    );
  }

  if (
    customerType ===
    "business"
  ) {
    return (
      <BusinessDashboard />
    );
  }

  return <Dashboard />;
};

export default CustomerDashboard;