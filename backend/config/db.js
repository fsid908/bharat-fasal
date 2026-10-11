
import mongoose from "mongoose";
import dns from "node:dns";

// Configure DNS servers for MongoDB Atlas SRV resolution
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  const start = Date.now();

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      family: 4,
    });

    console.log(
      `✅ MongoDB connected in ${Date.now() - start}ms`
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
