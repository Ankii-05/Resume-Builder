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

/* -----------------------------------
   Security Headers
----------------------------------- */
app.use(
  isProd
    ? helmet()
    : helmet({
        contentSecurityPolicy: false,
        crossOriginOpenerPolicy: {
          policy: "same-origin-allow-popups",
        },
      })
);

/* -----------------------------------
   CORS CONFIG
----------------------------------- */
function productionCorsOrigins() {
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.CLIENT_URL ||
    "http://localhost:5173";

  return raw
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const allowedOrigins = productionCorsOrigins();

const corsOptions = {
  origin(origin, callback) {
    // local dev allow all
    if (!isProd) {
      return callback(null, true);
    }

    // allow postman / mobile apps / no-origin requests
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  exposedHeaders: ["X-New-Token"],
};

app.use(cors(corsOptions));

/* -----------------------------------
   Body Parsers
----------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------------
   Session
----------------------------------- */
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "change-me-in-production",

    resave: false,

    saveUninitialized: false,

    name: "resumexpert.sid",

    cookie: {
      secure: isProd, // https only in production
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* -----------------------------------
   Passport
----------------------------------- */
configurePassport();

app.use(passport.initialize());
app.use(passport.session());

/* -----------------------------------
   Routes
----------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/admin", adminRoutes);

/* Google OAuth */
app.get("/google", googleInitHandler);

app.get(
  "/google/callback",
  googleOAuthCallbackAuthenticate,
  googleOAuthCallbackIssueJwt
);

/* -----------------------------------
   Static Uploads
----------------------------------- */
const uploadsAllowOrigin =
  process.env.UPLOADS_CORS_ORIGIN?.replace(/\/$/, "") ||
  allowedOrigins[0] ||
  "*";

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders(res) {
      res.set(
        "Access-Control-Allow-Origin",
        uploadsAllowOrigin
      );
    },
  })
);

/* -----------------------------------
   Health Routes
----------------------------------- */
app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/* -----------------------------------
   DB + Server Start
----------------------------------- */
try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `🚀 ResumeXpert API listening on port ${PORT}`
    );

    console.log(
      `Health Check: /health`
    );

    if (process.env.GOOGLE_CLIENT_ID) {
      try {
        console.log(
          `[Google OAuth] callback URL: ${getGoogleCallbackUrl()}`
        );
      } catch {
        //
      }
    }
  });
} catch (error) {
  console.error("Startup Failed:", error);
  process.exit(1);
}