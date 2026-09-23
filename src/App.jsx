import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Transfers from "./pages/Transfers";
import Cards from "./pages/Cards";
import Loans from "./pages/Loans";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";

import FinancialAdvisor from "./pages/FinancialAdvisor";
import Chatbot from "./pages/Chatbot";
import ReceiptScanner from "./pages/ReceiptScanner";
import FraudDetection from "./pages/FraudDetection";

import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import "./App.css";

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}

      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= PROTECTED ROUTES ================= */}

      <Route element={<ProtectedRoute />}>

        <Route element={<DashboardLayout />}>

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/accounts" element={<Accounts />} />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/transfers"
            element={<Transfers />}
          />

          <Route path="/cards" element={<Cards />} />

          <Route path="/loans" element={<Loans />} />

          <Route path="/budget" element={<Budget />} />

          <Route path="/analytics" element={<Analytics />} />

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

          {/* ================= ADMIN ================= */}

          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

        </Route>

      </Route>

      {/* ================= FALLBACK ================= */}

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