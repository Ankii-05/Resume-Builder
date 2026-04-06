import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  verifyAuth,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  googleInitHandler,
  googleOAuthCallbackAuthenticate,
  googleOAuthCallbackIssueJwt,
} from "../middlewares/googleAuthHandlers.js";
import { getGoogleCallbackUrl } from "../utils/googleOAuthConfig.js";

const router = express.Router();

/** Dev-only: verify routes + callback URL (no secrets). */
router.get("/google-oauth-debug", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).end();
  }
  try {
    const cb = getGoogleCallbackUrl();
    res.json({
      ok: true,
      passportCallbackUrl: cb,
      startUrls: [
        "GET /api/auth/google",
        "GET /google (same flow)",
      ],
      callbackPathsMounted: ["/google/callback", "/api/auth/google/callback"],
      frontendHint:
        "VITE_API_URL must use the same host:port as passportCallbackUrl (e.g. http://127.0.0.1:8000/)",
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.get("/verify", protect, verifyAuth);
router.post("/logout", protect, logoutUser);

router.get("/google", googleInitHandler);
router.get(
  "/google/callback",
  googleOAuthCallbackAuthenticate,
  googleOAuthCallbackIssueJwt
);

export default router;
