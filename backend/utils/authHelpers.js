/** Normalize email for lookup (matches Mongoose schema lowercase) */
export function normalizeEmail(email) {
  if (email == null || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}
