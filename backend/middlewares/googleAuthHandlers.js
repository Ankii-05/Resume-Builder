import passport from "passport";
import { generateToken } from "../utils/jwt.js";
import { isDatabaseUnavailableError } from "../config/db.js";
import { clientUrl } from "../utils/clientUrl.js";
import { sendWelcomeEmail } from "../utils/mailer.js";

export { clientUrl };

export const googleReady =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export function googleInitHandler(req, res, next) {
  if (!googleReady) {
    return res.redirect(
      `${clientUrl()}/auth/callback?error=google_not_configured`
    );
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
}

export function googleOAuthCallbackAuthenticate(req, res, next) {
  if (!googleReady) {
    return res.redirect(
      `${clientUrl()}/auth/callback?error=google_not_configured`
    );
  }
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.error("Google OAuth callback error:", err);
      const code = isDatabaseUnavailableError(err)
        ? "database_unavailable"
        : "google_auth_failed";
      return res.redirect(`${clientUrl()}/auth/callback?error=${code}`);
    }
    if (!user) {
      return res.redirect(
        `${clientUrl()}/auth/callback?error=google_auth_failed`
      );
    }
    req.googleOAuthInfo = info && typeof info === "object" ? info : {};
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("Session login after Google:", loginErr);
        return res.redirect(
          `${clientUrl()}/auth/callback?error=google_auth_failed`
        );
      }
      next();
    });
  })(req, res, next);
}

export function googleOAuthCallbackIssueJwt(req, res) {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.redirect(`${clientUrl()}/auth/callback?error=token_error`);
    }
    const token = generateToken(user._id, user.role ?? "user");
    if (req.googleOAuthInfo?.isNew === true) {
      try {
        sendWelcomeEmail(user.email, user.name);
      } catch (emailErr) {
        console.error("[google welcome email]", emailErr);
      }
    }
    res.redirect(
      `${clientUrl()}/auth/callback?token=${encodeURIComponent(token)}`
    );
  } catch (err) {
    console.error("Google callback token error:", err);
    res.redirect(`${clientUrl()}/auth/callback?error=token_error`);
  }
}
