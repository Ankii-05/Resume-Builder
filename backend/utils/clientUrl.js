/** First origin wins (OAuth redirect, email links). Comma-separated CLIENT_URL supported. */
export function clientUrl() {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  const first = raw.split(",")[0]?.trim() || "http://localhost:5173";
  return first.replace(/\/$/, "");
}
