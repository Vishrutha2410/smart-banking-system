import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import fraudRoutes from "./routes/fraudRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Fail fast with a clear message if required secrets are missing,
// rather than crashing later with an opaque "secretOrPrivateKey" error.
validateEnv();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] Smart Banking API running on http://localhost:${PORT}`);
  });
};

start();

export default app;
