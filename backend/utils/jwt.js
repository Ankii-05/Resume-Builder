import jwt from "jsonwebtoken";

/** Handles `JWT_SECRET = "value"` and stray quotes from .env files */
export function getJwtSecret() {
  const raw = process.env.JWT_SECRET;
  if (raw == null || raw === "") return "";
  return String(raw).trim().replace(/^["']|["']$/g, "");
}

const DEFAULT_USER_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";
const DEFAULT_ADMIN_EXPIRES = process.env.JWT_EXPIRES_IN_ADMIN || "30d";

function expiresInForRole(role) {
  return role === "admin" ? DEFAULT_ADMIN_EXPIRES : DEFAULT_USER_EXPIRES;
}

/**
 * @param {string} userId
 * @param {string} [role] — "admin" | "user" (default "user")
 */
export function generateToken(userId, role = "user") {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const normalized = role === "admin" ? "admin" : "user";
  return jwt.sign(
    { id: userId, role: normalized },
    secret,
    { expiresIn: expiresInForRole(normalized) }
  );
}

export function verifyToken(token) {
  const secret = getJwtSecret();
  if (!secret || !token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
