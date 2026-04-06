import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { isMongoConnected } from "./db.js";
import {
  getGoogleCallbackUrl,
  sanitizeGoogleOAuthEnv,
  warnIfSearchConsolePhpUrl,
  logGoogleOAuthDevHints,
  warnGoogleCloudClientSetup,
} from "../utils/googleOAuthConfig.js";

export function configurePassport() {
  sanitizeGoogleOAuthEnv();
  warnIfSearchConsolePhpUrl();
  logGoogleOAuthDevHints();
  warnGoogleCloudClientSetup();

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "Google OAuth: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing — /api/auth/google disabled."
    );
    return;
  }

  const callbackURL = getGoogleCallbackUrl();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Google OAuth] callbackURL = ${callbackURL}`);
  }
  if (callbackURL.includes(".php")) {
    console.error(
      "[Google OAuth] Callback URL contains .php — Google must redirect to this Node server, not PHP. Add e.g. http://127.0.0.1:8000/google/callback in Google Cloud."
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          if (!isMongoConnected()) {
            return done(
              new Error(
                "Database unavailable: MongoDB is not connected. Check MONGODB_URI and Atlas network access."
              ),
              null
            );
          }

          const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
          if (!email) {
            return done(new Error("No email from Google"), null);
          }

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            user.lastLogin = new Date();
            user.avatar = profile.photos?.[0]?.value || user.avatar;
            user.name = profile.displayName || user.name;
            await user.save();
            return done(null, user);
          }

          const existingEmail = await User.findOne({ email });

          if (existingEmail) {
            existingEmail.googleId = profile.id;
            existingEmail.avatar =
              profile.photos?.[0]?.value || existingEmail.avatar;
            existingEmail.isEmailVerified = true;
            existingEmail.lastLogin = new Date();
            await existingEmail.save();
            return done(null, existingEmail);
          }

          user = await User.create({
            googleId: profile.id,
            email,
            name: profile.displayName || email.split("@")[0],
            avatar: profile.photos?.[0]?.value || null,
            provider: "google",
            isEmailVerified: true,
            lastLogin: new Date(),
          });

          return done(null, user);
        } catch (err) {
          console.error("Google OAuth strategy error:", err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select("-password");
      done(null, user);
    } catch (e) {
      done(e, null);
    }
  });
}

export default passport;
