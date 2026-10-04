import { Routes, Route } from "react-router-dom";

// ======================================================
// PUBLIC
// ======================================================
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// ======================================================
// MAIN BANKING
// ======================================================
import CustomerDashboard from "./pages/CustomerDashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Transfers from "./pages/Transfers";
import Expenses from "./pages/Expenses";
import Cards from "./pages/Cards";
import Loans from "./pages/Loans";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";

// ======================================================
// AI
// ======================================================
import FinancialAdvisor from "./pages/FinancialAdvisor";
import Chatbot from "./pages/Chatbot";
import ReceiptScanner from "./pages/ReceiptScanner";
import FraudDetection from "./pages/FraudDetection";

// ======================================================
// USER
// ======================================================
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// ======================================================
// BUSINESS
// ======================================================
import BusinessExpenses from "./pages/BusinessExpenses";
import Invoices from "./pages/Invoices";

// ======================================================
// STUDENT
// ======================================================
import StudentProfile from "./pages/StudentProfile";
import StudentBenefits from "./pages/StudentBenefits";

// ======================================================
// ADMIN
// ======================================================
import AdminDashboard from "./pages/AdminDashboard";

// ======================================================
// ROUTE GUARDS
// ======================================================
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import CustomerTypeRoute from "./components/CustomerTypeRoute";

// ======================================================
// LAYOUT
// ======================================================
import DashboardLayout from "./layouts/DashboardLayout";

import "./App.css";

function App() {
  return (
    <Routes>
      {/* ==================================================
          PUBLIC
      ================================================== */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* ==================================================
          PROTECTED
      ================================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* ==================================================
              CUSTOMER DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={<CustomerDashboard />}
          />

          {/* ==================================================
              SHARED BANKING
              Available for all customer types
          ================================================== */}

          <Route
            path="/accounts"
            element={<Accounts />}
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/transfers"
            element={<Transfers />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* ==================================================
              PERSONAL + STUDENT
          ================================================== */}

          <Route
            element={
              <CustomerTypeRoute
                allowedTypes={[
                  "personal",
                  "student",
                ]}
              />
            }
          >
            <Route
              path="/expenses"
              element={<Expenses />}
            />

            <Route
              path="/loans"
              element={<Loans />}
            />

            <Route
              path="/budget"
              element={<Budget />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/financial-advisor"
              element={<FinancialAdvisor />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />
          </Route>

          {/* ==================================================
              BUSINESS
              
              IMPORTANT:
              Business has its own route group so the
              CustomerTypeRoute will not redirect it
              back to /dashboard.
          ================================================== */}

          <Route
            element={
              <CustomerTypeRoute
                allowedTypes={["business"]}
              />
            }
          >
            <Route
              path="/loans"
              element={<Loans />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/business-expenses"
              element={<BusinessExpenses />}
            />

            <Route
              path="/invoices"
              element={<Invoices />}
            />
          </Route>

          {/* ==================================================
              PERSONAL ONLY
          ================================================== */}

          <Route
            element={
              <CustomerTypeRoute
                allowedTypes={["personal"]}
              />
            }
          >
            <Route
              path="/cards"
              element={<Cards />}
            />

            <Route
              path="/receipt-scanner"
              element={<ReceiptScanner />}
            />

            <Route
              path="/fraud-detection"
              element={<FraudDetection />}
            />

            <Route
              path="/chatbot"
              element={<Chatbot />}
            />
          </Route>

          {/* ==================================================
              STUDENT ONLY
          ================================================== */}

          <Route
            element={
              <CustomerTypeRoute
                allowedTypes={["student"]}
              />
            }
          >
            <Route
              path="/student-profile"
              element={<StudentProfile />}
            />

            <Route
              path="/student-benefits"
              element={<StudentBenefits />}
            />
          </Route>

          {/* ==================================================
              ADMIN
          ================================================== */}

          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

        </Route>
      </Route>

      {/* ==================================================
          FALLBACK
      ================================================== */}

      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center text-slate-500">
            Page not found.
          </div>
        }
      />
    </Routes>
  );
}

export default App;