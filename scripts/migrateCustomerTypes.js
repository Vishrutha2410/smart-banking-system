import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";

const runMigration = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "[Migration] Connected to MongoDB"
    );

    const result =
      await User.updateMany(
        {
          $or: [
            {
              customerType: {
                $exists: false,
              },
            },
            {
              customerType: null,
            },
            {
              customerType: "",
            },
          ],
        },
        {
          $set: {
            customerType:
              "personal",
          },
        }
      );

    console.log(
      `[Migration] Matched: ${result.matchedCount}`
    );

    console.log(
      `[Migration] Modified: ${result.modifiedCount}`
    );

    console.log(
      "[Migration] Existing users are now Personal customers."
    );
  } catch (error) {
    console.error(
      "[Migration] Failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runMigration();