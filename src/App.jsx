import { Routes, Route } from "react-router-dom";

// Public pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Main banking pages
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Transfers from "./pages/Transfers";
import Expenses from "./pages/Expenses";
import Cards from "./pages/Cards";
import Loans from "./pages/Loans";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";

// AI and smart features
import FinancialAdvisor from "./pages/FinancialAdvisor";
import Chatbot from "./pages/Chatbot";
import ReceiptScanner from "./pages/ReceiptScanner";
import FraudDetection from "./pages/FraudDetection";

// User pages
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Admin
import AdminDashboard from "./pages/AdminDashboard";

// Route protection
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Main application layout
import DashboardLayout from "./layouts/DashboardLayout";

import "./App.css";

function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ====================================================== */}

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

      {/* =====================================================
          PROTECTED ROUTES
      ====================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route element={<DashboardLayout />}>

          {/* ================= MAIN DASHBOARD ================= */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* ================= ACCOUNTS ================= */}

          <Route
            path="/accounts"
            element={<Accounts />}
          />

          {/* ================= TRANSACTIONS ================= */}

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          {/* ================= FUND TRANSFER ================= */}

          <Route
            path="/transfers"
            element={<Transfers />}
          />

          {/* ================= EXPENSES ================= */}

          <Route
            path="/expenses"
            element={<Expenses />}
          />

          {/* ================= CARDS ================= */}

          <Route
            path="/cards"
            element={<Cards />}
          />

          {/* ================= LOANS ================= */}

          <Route
            path="/loans"
            element={<Loans />}
          />

          {/* ================= BUDGET ================= */}

          <Route
            path="/budget"
            element={<Budget />}
          />

          {/* ================= ANALYTICS ================= */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* =================================================
              AI FEATURES
          ================================================== */}

          <Route
            path="/financial-advisor"
            element={<FinancialAdvisor />}
          />

          <Route
            path="/chatbot"
            element={<Chatbot />}
          />

          <Route
            path="/receipt-scanner"
            element={<ReceiptScanner />}
          />

          <Route
            path="/fraud-detection"
            element={<FraudDetection />}
          />

          {/* =================================================
              USER FEATURES
          ================================================== */}

          <Route
            path="/reports"
            element={<Reports />}
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

          {/* =================================================
              ADMIN ROUTES
          ================================================== */}

          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

        </Route>
      </Route>

      {/* =====================================================
          FALLBACK
      ====================================================== */}

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