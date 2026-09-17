/**
 * Development-only utility to promote an existing user to the "admin" role.
 * There is no public admin registration endpoint - this keeps privilege
 * escalation out of the HTTP API surface.
 *
 * Usage:
 *   node scripts/makeAdmin.js user@example.com
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/makeAdmin.js <email>");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = "admin";
  await user.save();

  console.log(`✔ ${user.email} is now an admin.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
