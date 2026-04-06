import jwt from "jsonwebtoken";

/** Handles `JWT_SECRET = "value"` and stray quotes from .env files */
export function getJwtSecret() {
  const raw = process.env.JWT_SECRET;
  if (raw == null || raw === "") return "";
  return String(raw).trim().replace(/^["']|["']$/g, "");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function generateToken(userId) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: JWT_EXPIRES_IN });
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
