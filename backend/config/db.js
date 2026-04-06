import mongoose from "mongoose";

function extractMongoUriHost(uri) {
  try {
    const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
    return u.hostname || null;
  } catch {
    return null;
  }
}

function logMongoAtlasHelp(uri, err) {
  const msg = String(err?.message || err);
  const host = uri ? extractMongoUriHost(uri) : null;
  const dnsLike =
    /querySrv ENOTFOUND|ENOTFOUND|ECONNREFUSED|getaddrinfo|NXDOMAIN|does not exist/i.test(
      msg
    );

  if (!dnsLike && !/Server selection timed out|authentication failed/i.test(msg)) {
    return;
  }

  console.warn("[MongoDB] ──────────────────────────────────────────────────");
  if (host) {
    console.warn(
      `[MongoDB] Host in your URI: ${host}`
    );
  }
  if (/querySrv ENOTFOUND|ENOTFOUND|NXDOMAIN|does not exist/i.test(msg)) {
    console.warn(
      "[MongoDB] Public DNS cannot resolve this Atlas hostname. That usually means:"
    );
    console.warn(
      "  • The cluster was deleted, renamed, or you pasted an old connection string."
    );
    console.warn(
      "  • There is a typo in the subdomain (compare with Atlas exactly)."
    );
    console.warn(
      "[MongoDB] Fix: MongoDB Atlas → Database → your ACTIVE cluster → Connect →"
    );
    console.warn(
      "  “Connect your application” → copy the FULL new connection string into MONGODB_URI."
    );
    console.warn(
      "[MongoDB] Optional: Atlas also offers a non-SRV mongodb://… string if SRV is blocked on your network."
    );
  } else if (/authentication failed|bad auth/i.test(msg)) {
    console.warn(
      "[MongoDB] Auth failed — check database username/password in the URI (URL-encode special chars in passwords, e.g. @ → %40)."
    );
  } else if (/Server selection timed out/i.test(msg)) {
    console.warn(
      "[MongoDB] Timeout — Atlas → Network Access: allow your current IP (or 0.0.0.0/0 for local dev only)."
    );
  }
  console.warn("[MongoDB] ──────────────────────────────────────────────────");
}

/** ReadyState 1 = connected (see mongoose.connection.states) */
export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/** True for errors where auth/DB operations should not look like a generic Google failure */
export function isDatabaseUnavailableError(err) {
  if (!err) return false;
  const m = String(err.message || err);
  return /buffering timed out|not connected|Database unavailable|MongoServerSelectionError|MongoNetworkError|getaddrinfo ENOTFOUND|querySrv ENOTFOUND|ECONNREFUSED/i.test(
    m
  );
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    mongoose.set("bufferCommands", false);
    console.warn(
      "MONGODB_URI is not set — MongoDB disabled. Set it in .env for auth, resumes, and Google sign-in user storage."
    );
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 12_000,
    });
    console.log("DB CONNECTED");
  } catch (err) {
    mongoose.set("bufferCommands", false);
    console.warn(
      "MongoDB connection failed — resume/auth need the database. ATS API still runs."
    );
    console.warn(err?.message || err);
    logMongoAtlasHelp(uri, err);
  }
};
