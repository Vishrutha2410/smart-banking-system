import dotenv from "dotenv";

dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/User.js";

const run = async () => {
  try {
    await connectDB();

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
              customerType: {
                $nin: [
                  "personal",
                  "student",
                  "business",
                ],
              },
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
      `[Migration] Updated ${result.modifiedCount} users to customerType=personal.`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "[Migration] Failed:",
      error
    );

    process.exit(1);
  }
};

run();