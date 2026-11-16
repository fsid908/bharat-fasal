import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/user.model.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const mobile = "9000000000";
    const password = "Sidd@123";

    const existingAdmin = await User.findOne({
      mobile,
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const admin = await User.create({
      role: "admin",
      name: "Bharat Fasal Admin",
      mobile,
      email: "admin@bharatfasal.com",
      district: "Maharajganj",
      state: "Uttar Pradesh",
      passwordHash,
      termsAccepted: true,
    });

    console.log("✅ Admin created successfully");
    console.log("📱 Mobile:", admin.mobile);
    console.log("🔐 Password:", password);

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Admin creation failed:",
      error.message
    );

    process.exit(1);
  }
};

createAdmin();