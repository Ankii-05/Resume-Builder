import { protect } from "./authMiddleware.js";

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

/** JWT auth + admin role check */
export const isAdmin = [protect, requireAdmin];
