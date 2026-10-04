import { useAuth } from "../context/AuthContext";

import Expenses from "./Expenses";
import BusinessExpenses from "./BusinessExpenses";

const CustomerExpenses = () => {
  const { user } = useAuth();

  if (
    user?.customerType === "business"
  ) {
    return <BusinessExpenses />;
  }

  return <Expenses />;
};

export default CustomerExpenses;