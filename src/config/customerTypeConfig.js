import {
  FiHome,
  FiCreditCard,
  FiList,
  FiSend,
  FiDollarSign,
  FiFileText,
  FiPieChart,
  FiTrendingUp,
  FiCpu,
  FiMessageCircle,
  FiCamera,
  FiShield,
  FiBell,
  FiUser,
  FiSettings,
  FiBookOpen,
  FiTarget,
} from "react-icons/fi";

// ======================================================
// COMMON ACCOUNT ITEMS
// ======================================================

const commonAccountItems = [
  {
    to: "/notifications",
    label: "Notifications",
    icon: FiBell,
  },

  {
    to: "/profile",
    label: "Profile",
    icon: FiUser,
  },

  {
    to: "/settings",
    label: "Settings",
    icon: FiSettings,
  },
];

// ======================================================
// PERSONAL CUSTOMER
// ======================================================

const personalItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: FiHome,
  },

  {
    to: "/accounts",
    label: "Accounts",
    icon: FiCreditCard,
  },

  {
    to: "/transactions",
    label: "Transactions",
    icon: FiList,
  },

  {
    to: "/transfers",
    label: "Fund Transfer",
    icon: FiSend,
  },

  {
    to: "/expenses",
    label: "Expenses",
    icon: FiDollarSign,
  },

  {
    to: "/cards",
    label: "Cards",
    icon: FiCreditCard,
  },

  {
    to: "/loans",
    label: "Loans",
    icon: FiFileText,
  },

  {
    to: "/budget",
    label: "Budget",
    icon: FiPieChart,
  },

  {
    to: "/analytics",
    label: "Analytics",
    icon: FiTrendingUp,
  },

  {
    to: "/financial-advisor",
    label: "AI Financial Advisor",
    icon: FiCpu,
  },

  {
    to: "/chatbot",
    label: "AI Chatbot",
    icon: FiMessageCircle,
  },

  {
    to: "/receipt-scanner",
    label: "Receipt Scanner",
    icon: FiCamera,
  },

  {
    to: "/fraud-detection",
    label: "Fraud Detection",
    icon: FiShield,
  },

  {
    to: "/reports",
    label: "Reports",
    icon: FiFileText,
  },
];

// ======================================================
// STUDENT CUSTOMER
// ======================================================

const studentItems = [
  {
    to: "/dashboard",
    label: "Student Dashboard",
    icon: FiHome,
  },

  {
    to: "/accounts",
    label: "My Accounts",
    icon: FiCreditCard,
  },

  {
    to: "/transactions",
    label: "Transactions",
    icon: FiList,
  },

  {
    to: "/transfers",
    label: "Fund Transfer",
    icon: FiSend,
  },

  {
    to: "/expenses",
    label: "Student Expenses",
    icon: FiDollarSign,
  },

  {
    to: "/loans",
    label: "Education Loans",
    icon: FiFileText,
  },

  {
    to: "/budget",
    label: "Student Budget",
    icon: FiPieChart,
  },

  {
    to: "/analytics",
    label: "Spending Analytics",
    icon: FiTrendingUp,
  },

  {
    to: "/financial-advisor",
    label: "Financial Advisor",
    icon: FiCpu,
  },

  {
    to: "/student-benefits",
    label: "Student Benefits",
    icon: FiBookOpen,
  },

  {
    to: "/student-profile",
    label: "Student Profile",
    icon: FiUser,
  },

  {
    to: "/reports",
    label: "Financial Reports",
    icon: FiFileText,
  },
];

// ======================================================
// BUSINESS CUSTOMER
// ======================================================

const businessItems = [
  {
    to: "/dashboard",
    label: "Business Dashboard",
    icon: FiHome,
  },

  {
    to: "/accounts",
    label: "Business Accounts",
    icon: FiCreditCard,
  },

  {
    to: "/transactions",
    label: "Transactions",
    icon: FiList,
  },

  {
    to: "/transfers",
    label: "Business Transfers",
    icon: FiSend,
  },

  {
    to: "/loans",
    label: "Business Loans",
    icon: FiFileText,
  },

  {
    to: "/analytics",
    label: "Business Analytics",
    icon: FiTrendingUp,
  },

  {
    to: "/reports",
    label: "Business Reports",
    icon: FiFileText,
  },
];

// ======================================================
// CUSTOMER CONFIGURATION
// ======================================================

export const customerTypeConfig = {
  personal: {
    label: "Personal Banking",

    description:
      "Manage your personal finances, spending and savings.",

    items: personalItems,
  },

  student: {
    label: "Student Banking",

    description:
      "Manage your education, expenses, savings and student finances.",

    items: studentItems,
  },

  business: {
    label: "Business Banking",

    description:
      "Manage your business accounts, transfers and finances.",

    items: businessItems,
  },
};

// ======================================================
// GET CONFIG
// ======================================================

export const getCustomerTypeConfig = (
  customerType
) => {
  return (
    customerTypeConfig[
      customerType
    ] ||
    customerTypeConfig.personal
  );
};

// ======================================================
// GET LABEL
// ======================================================

export const getCustomerTypeLabel = (
  customerType
) => {
  return getCustomerTypeConfig(
    customerType
  ).label;
};

// ======================================================
// COMMON ITEMS
// ======================================================

export const getCommonAccountItems =
  () => {
    return commonAccountItems;
  };