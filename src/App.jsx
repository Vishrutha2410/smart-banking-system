import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import FundTransfer from "./pages/FundTransfer";
import Cards from "./pages/Cards";
import Loans from "./pages/Loans";

import Budget from "./pages/Budget";
import AIFinancialAdvisor from "./pages/AIFinancialAdvisor";
import AIChatbot from "./pages/AIChatbot";
import ReceiptScanner from "./pages/ReceiptScanner";
import FraudDetection from "./pages/FraudDetection";

import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/fund-transfer" element={<FundTransfer />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/financial-advisor" element={<AIFinancialAdvisor />} />
        <Route path="/chatbot" element={<AIChatbot />} />
        <Route path="/receipt-scanner" element={<ReceiptScanner />} />
        <Route path="/fraud-detection" element={<FraudDetection />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;