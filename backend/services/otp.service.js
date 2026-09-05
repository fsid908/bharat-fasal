import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const otpStore = new Map();

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const sendOtp = async (mobile) => {
  const normalizedMobile = String(mobile || "").trim();

  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    const error = new Error("Please enter a valid 10 digit mobile number");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ mobile: normalizedMobile });

  if (!user) {
    const error = new Error("No account found with this mobile number");
    error.statusCode = 404;
    throw error;
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore.set(normalizedMobile, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY,
  });

  console.log(`🔐 OTP for ${normalizedMobile}: ${otp}`);

  return true;
};

export const verifyOtp = async (mobile, otp) => {
  const normalizedMobile = String(mobile || "").trim();
  const normalizedOtp = String(otp || "").trim();

  const stored = otpStore.get(normalizedMobile);

  if (!stored) {
    const error = new Error("OTP not found or expired");
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedMobile);

    const error = new Error("OTP has expired");
    error.statusCode = 400;
    throw error;
  }

  if (stored.otp !== normalizedOtp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  return true;
};

export const resetPassword = async (mobile, otp, newPassword) => {
  const normalizedMobile = String(mobile || "").trim();

  await verifyOtp(normalizedMobile, otp);

  if (!newPassword || newPassword.length < 6) {
    const error = new Error("New password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ mobile: normalizedMobile });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  otpStore.delete(normalizedMobile);

  return true;
};