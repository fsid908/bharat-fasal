import express from "express";
import {
  register,
  login,
  getCurrentUser,
  sendPasswordOtp,
  verifyPasswordOtp,
  resetUserPassword,
} from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// register new user
router.post("/register", register);

// login existing user
router.post("/login", login);

// get current authenticated user
router.get("/me", protect, getCurrentUser);

router.post("/forgot-password/send-otp", sendPasswordOtp);

router.post("/forgot-password/verify-otp", verifyPasswordOtp);

router.post("/forgot-password/reset", resetUserPassword);

export default router;