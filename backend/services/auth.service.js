import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// ======================================================
// REGISTER USER
// ======================================================

export const registerUser = async ({
  role,
  name,
  organizationName,
  phone,
  email,
  village,
  district,
  state,
  businessType,
  password,
  agreeTerms,
}) => {
  // ----------------------------------------------------
  // Normalize frontend data
  // ----------------------------------------------------

  const normalizedRole = String(role || "").trim().toLowerCase();

  const normalizedName = String(name || "").trim();

  const normalizedOrganizationName = String(
    organizationName || ""
  ).trim();

  // Frontend uses "phone", MongoDB uses "mobile"
  const normalizedMobile = String(phone || "").trim();

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const normalizedVillage = String(village || "").trim();

  const normalizedDistrict = String(district || "").trim();

  const normalizedState = String(state || "").trim();

  const normalizedBusinessType = String(
    businessType || ""
  ).trim();

  // ----------------------------------------------------
  // Required field validation
  // ----------------------------------------------------

  if (
    !normalizedRole ||
    !normalizedName ||
    !normalizedMobile ||
    !normalizedDistrict ||
    !normalizedState ||
    !password
  ) {
    const error = new Error(
      "All required fields must be provided"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Farmer village validation
  // ----------------------------------------------------

  if (
    normalizedRole === "farmer" &&
    !normalizedVillage
  ) {
    const error = new Error(
      "Village is required for farmer"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Validate role
  // ----------------------------------------------------

  const allowedRoles = [
    "farmer",
    "fpo",
    "buyer",
  ];

  if (!allowedRoles.includes(normalizedRole)) {
    const error = new Error(
      "Invalid user role"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Validate mobile number
  // ----------------------------------------------------

  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    const error = new Error(
      "Invalid mobile number"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Validate password
  // ----------------------------------------------------

  if (password.length < 6) {
    const error = new Error(
      "Password must be at least 6 characters"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Terms & Conditions
  // ----------------------------------------------------

  if (agreeTerms !== true) {
    const error = new Error(
      "Terms and Conditions must be accepted"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Validate email
  // ----------------------------------------------------

  if (
    normalizedEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    const error = new Error(
      "Invalid email address"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Check duplicate mobile
  // ----------------------------------------------------

  const existingMobile = await User.findOne({
    mobile: normalizedMobile,
  });

  if (existingMobile) {
    const error = new Error(
      "An account with this mobile number already exists"
    );

    error.statusCode = 409;

    throw error;
  }

  // ----------------------------------------------------
  // Check duplicate email
  // ----------------------------------------------------

  if (normalizedEmail) {
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      const error = new Error(
        "An account with this email already exists"
      );

      error.statusCode = 409;

      throw error;
    }
  }

  // ----------------------------------------------------
  // Hash password
  // ----------------------------------------------------

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  // ----------------------------------------------------
  // Create user in MongoDB
  // ----------------------------------------------------

  const user = await User.create({
    role: normalizedRole,

    name: normalizedName,

    ...(normalizedOrganizationName && {
      organizationName:
        normalizedOrganizationName,
    }),

    mobile: normalizedMobile,

    ...(normalizedEmail && {
      email: normalizedEmail,
    }),

    ...(normalizedVillage && {
      village: normalizedVillage,
    }),

    district: normalizedDistrict,

    state: normalizedState,

    ...(normalizedBusinessType && {
      businessType:
        normalizedBusinessType,
    }),

    passwordHash,

    termsAccepted: true,
  });

  // ----------------------------------------------------
  // Return SAFE user data
  // Never return passwordHash
  // ----------------------------------------------------

  return {
    id: user._id,

    role: user.role,

    name: user.name,

    organizationName:
      user.organizationName || "",

    mobile: user.mobile,

    email: user.email || null,

    village: user.village || "",

    district: user.district,

    state: user.state,

    businessType:
      user.businessType || "",

    termsAccepted:
      user.termsAccepted,
  };
};


// ======================================================
// LOGIN USER
// ======================================================

export const loginUser = async ({
  mobile,
  password,
}) => {
  // ----------------------------------------------------
  // Normalize input
  // ----------------------------------------------------

  const normalizedMobile = String(
    mobile || ""
  ).trim();

  // ----------------------------------------------------
  // Required fields
  // ----------------------------------------------------

  if (!normalizedMobile || !password) {
    const error = new Error(
      "Mobile number and password are required"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Validate mobile
  // ----------------------------------------------------

  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    const error = new Error(
      "Invalid mobile number"
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------------------
  // Find user
  // ----------------------------------------------------

  const user = await User.findOne({
    mobile: normalizedMobile,
  });

  if (!user) {
    const error = new Error(
      "Invalid mobile number or password"
    );

    error.statusCode = 401;

    throw error;
  }

  // ----------------------------------------------------
  // Compare password
  // ----------------------------------------------------

  const passwordMatch =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!passwordMatch) {
    const error = new Error(
      "Invalid mobile number or password"
    );

    error.statusCode = 401;

    throw error;
  }

  // ----------------------------------------------------
  // Generate JWT
  // ----------------------------------------------------

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "1d",
    }
  );

  // ----------------------------------------------------
  // Return safe user + token
  // ----------------------------------------------------

  return {
    token,

    user: {
      id: user._id,

      role: user.role,

      name: user.name,

      organizationName:
        user.organizationName || "",

      mobile: user.mobile,

      email: user.email || null,

      village: user.village || "",

      district: user.district,

      state: user.state,

      businessType:
        user.businessType || "",

      termsAccepted:
        user.termsAccepted,
    },
  };
};