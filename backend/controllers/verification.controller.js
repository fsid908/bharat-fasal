import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";

// ============================================================
// HELPERS
// ============================================================

const error = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const getUser = (req) => User.findById(req.user.userId);

const saveVerification = (userId, data) =>
  Verification.findOneAndUpdate(
    { userId },
    {
      userId,
      ...data,
      submittedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

// ============================================================
// BUYER VERIFICATION
// ============================================================

export const submitBuyerVerification = async (req, res) => {
  try {
    const user = await getUser(req);

    if (!user) return error(res, "User not found", 404);
    if (user.role !== "buyer")
      return error(res, "Only buyers can submit buyer verification", 403);

    const {
      businessName,
      businessType,
      address,
      pan,
      gstin,
      documents,
      bankName,
      accountNumber,
      ifsc,
      upi,
    } = req.body;

    const required = [
      [businessName, "Business name"],
      [businessType, "Business type"],
      [address, "Business address"],
      [pan, "PAN"],
      [gstin, "GSTIN"],
      [bankName, "Bank name"],
      [accountNumber, "Account number"],
      [ifsc, "IFSC"],
    ];

    for (const [value, label] of required) {
      if (!value?.trim()) return error(res, `${label} is required`);
    }

    const requiredDocs = {
      pan: "PAN document",
      gst: "GST registration document",
      businessProof: "Business proof",
      bankProof: "Bank account proof",
    };

    for (const [key, label] of Object.entries(requiredDocs)) {
      if (!documents?.[key]) return error(res, `${label} is required`);
    }

    const verification = await saveVerification(req.user.userId, {
      type: "buyer",
      name: user.name,
      phone: user.mobile,
      email: user.email || "",
      businessName: businessName.trim(),
      companyName: businessName.trim(),
      businessType: businessType.trim(),
      address: address.trim(),
      location: `${user.district}, ${user.state}`,
      pan: pan.trim().toUpperCase(),
      gstin: gstin.trim().toUpperCase(),
      documents: Object.fromEntries(
        Object.keys(requiredDocs).map((key) => [key, Boolean(documents[key])]),
      ),
      bankName: bankName.trim(),
      bankAccount: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      upi: upi?.trim() || "",
      status: "pending",
      rejectionReason: "",
    });

    return res.status(200).json({
      success: true,
      message: "Verification submitted successfully",
      verification,
    });
  } catch (err) {
    console.error("Buyer verification error:", err);
    return error(res, "Unable to submit verification", 500);
  }
};

// ============================================================
// FARMER VERIFICATION
// ============================================================

export const submitFarmerVerification = async (req, res) => {
  try {
    const user = await getUser(req);

    if (!user) return error(res, "User not found", 404);
    if (user.role !== "farmer")
      return error(res, "Only farmers can submit farmer verification", 403);

    const { fullName, idType, idReference } = req.body;

    const required = [
      [fullName, "Full name"],
      [idType, "Government ID type"],
      [idReference, "Government ID number"],
    ];

    for (const [value, label] of required) {
      if (!value?.trim()) return error(res, `${label} is required`);
    }

    const location = [user.district, user.state].filter(Boolean).join(", ");

    const verification = await saveVerification(req.user.userId, {
      type: "farmer",
      name: fullName.trim(),
      phone: user.mobile,
      email: user.email || "",
      idType: idType.trim(),
      idReference: idReference.trim(),
      location,
      status: "pending",
      rejectionReason: "",
    });

    return res.status(200).json({
      success: true,
      message: "Farmer verification submitted successfully",
      verification,
    });
  } catch (err) {
    console.error("Farmer verification error:", err);
    return error(res, "Unable to submit farmer verification", 500);
  }
};

// ============================================================
// GET MY VERIFICATION
// ============================================================

export const getMyVerification = async (req, res) => {
  try {
    const verification = await Verification.findOne({
      userId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      verification: verification || null,
    });
  } catch (err) {
    console.error("Get verification error:", err);
    return error(res, "Unable to get verification status", 500);
  }
};
