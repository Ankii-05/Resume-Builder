// server.js
import "dotenv/config";

if (
  process.env.GOOGLE_VERIFY_SSL === "false" &&
  process.env.NODE_ENV !== "production"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn(
    "[Google OAuth] GOOGLE_VERIFY_SSL=false — TLS certificate verification is disabled (development only)."
  );
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/admin.js";
import passport, { configurePassport } from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import atsRoutes from "./routes/atsRoutes.js";
import {
  getGoogleCallbackUrl,
  sanitizeGoogleOAuthEnv,
} from "./utils/googleOAuthConfig.js";
import {
  googleInitHandler,
  googleOAuthCallbackAuthenticate,
  googleOAuthCallbackIssueJwt,
} from "./middlewares/googleAuthHandlers.js";

sanitizeGoogleOAuthEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";
app.use(
  isProd
    ? helmet()
    : helmet({
        contentSecurityPolicy: false,
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      })
);

function productionCorsOrigins() {
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.CLIENT_URL ||
    "http://localhost:5173";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const clientOrigin = productionCorsOrigins()[0] || "http://localhost:5173";

app.use(
  cors({
    origin(origin, callback) {
      if (!isProd) {
        return callback(null, true);
      }
      const allowed = productionCorsOrigins();
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-New-Token"],
  })
);

configurePassport();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    // Dev: must allow Passport to persist OAuth state in session on first redirect
    saveUninitialized: !isProd,
    name: "resumexpert.sid",
    cookie: {
      secure: isProd,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);

app.get("/google/callback", googleOAuthCallbackAuthenticate, googleOAuthCallbackIssueJwt);
app.get("/google", googleInitHandler);

app.use("/api/resume", resumeRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/admin", adminRoutes);

// Public read; * avoids mismatch when multiple frontends (Vercel + local) load images.
const uploadsAllowOrigin =
  process.env.UPLOADS_CORS_ORIGIN?.replace(/\/$/, "") || "*";

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, _path) => {
      res.set("Access-Control-Allow-Origin", uploadsAllowOrigin);
    },
  })
);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`🚀 ResumeXpert API listening on port ${PORT}`);
  console.log(`   Try: http://127.0.0.1:${PORT}/health  (must say JSON from Node, not a PHP/HTML page)`);
  if (!isProd && Number(PORT) === 8000) {
    console.warn(
      "[ResumeXpert] Port 8000 is often used by PHP (e.g. php artisan serve / XAMPP). " +
        "If Google OAuth returns 404 with a Laravel-style page, stop PHP or set PORT=8080, " +
        "update GOOGLE_REDIRECT_URI + Google Console redirect URI + VITE_API_URL to the same port."
    );
  }
  if (process.env.GOOGLE_CLIENT_ID) {
    try {
      console.log(
        `[Google OAuth] callback URL (must match Google Console): ${getGoogleCallbackUrl()}`
      );
    } catch {
      /* ignore */
    }
  }
});
