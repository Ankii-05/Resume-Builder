import bcrypt from "bcryptjs";
import User from "../models/User.js";

const ADMIN_EMAIL = "admin@resumexpert.com";

/**
 * NOT run automatically on server start — promote users by setting role in MongoDB instead.
 * Optional: import and call from a one-off script if you still want a seeded admin@resumexpert.com.
 *
 * Creates the default admin, or fixes an existing row with this email:
 * - If someone registered this email first, they had role "user" — promote to admin and set the default password.
 * - Google-only account with this email: add local password so admin login works.
 * - Does not reset password on every boot once role is admin and local password exists.
 */
export async function seedAdmin() {
  try {
    const hashed = await bcrypt.hash("Admin@123", 10);
    const user = await User.findOne({ email: ADMIN_EMAIL }).select("+password");

    if (!user) {
      await User.create({
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        role: "admin",
        provider: "local",
        isEmailVerified: true,
      });
      console.log("[Admin] Admin user seeded");
      return;
    }

    if (user.role !== "admin") {
      user.role = "admin";
      user.provider = "local";
      user.password = hashed;
      user.name = user.name || "Admin";
      user.isEmailVerified = true;
      await user.save();
      console.log("[Admin] Promoted to admin — password set to Admin@123 (change in production)");
      return;
    }

    if (user.provider === "google" || !user.password) {
      user.provider = "local";
      user.password = hashed;
      await user.save();
      console.log("[Admin] Admin local password set for dashboard login");
      return;
    }

    console.log("[Admin] Admin already exists");
  } catch (e) {
    console.error("[Admin] Seed failed:", e?.message || e);
  }
}
