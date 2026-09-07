import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import fraudRoutes from "./routes/fraudRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
dotenv.config();

const app = express();

connectDB();

app.use(cors());

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "SmartBank Backend Running 🚀",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on port ${PORT}`
  );
});