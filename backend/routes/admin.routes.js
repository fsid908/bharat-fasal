import express from "express";

import {
  getPendingVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
} from "../controllers/admin.controller.js";

import protect from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/verifications", getPendingVerifications);

router.get("/verifications/:id", getVerificationById);

router.patch("/verifications/:id/approve", approveVerification);

router.patch("/verifications/:id/reject", rejectVerification);

export default router;
