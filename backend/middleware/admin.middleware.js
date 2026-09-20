import AppError from "../utils/AppError.js";

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }

  next();
};

export default adminOnly;