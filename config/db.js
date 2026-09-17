import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_banking";

  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri, {
      // Modern mongoose (8.x) does not need extra options,
      // but these are safe defaults for local dev.
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
    });

    return conn;
  } catch (error) {
    console.error("[MongoDB] Initial connection failed:", error.message);
    console.error(
      "Make sure MongoDB is running locally (mongod) and MONGO_URI in .env is correct."
    );
    // Do not silently continue with a broken DB layer.
    process.exit(1);
  }
};

export default connectDB;
