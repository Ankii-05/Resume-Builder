/** Trim common .env copy/paste issues (spaces, newlines) */
export function sanitizeGoogleOAuthEnv() {
  if (process.env.GOOGLE_CLIENT_ID) {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID.trim();
  }
  if (process.env.GOOGLE_CLIENT_SECRET) {
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET.trim();
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    process.env.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI.trim();
  }
  if (process.env.GOOGLE_CALLBACK_URL) {
    process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL.trim();
  }
}

/**
 * Google OAuth callback URL must match **exactly** what is configured in
 * Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs.
 *
 * Priority:
 *   1. GOOGLE_REDIRECT_URI
 *   2. GOOGLE_CALLBACK_URL
 *   3. Default: http://localhost:{PORT}/api/auth/google/callback
 */
export function getGoogleCallbackUrl() {
  const raw =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    process.env.GOOGLE_CALLBACK_URL?.trim();

  if (raw) {
    try {
      const u = new URL(raw);
      const path = u.pathname.replace(/\/+$/, "") || "/";
      u.pathname = path;
      return u.href.replace(/\/$/, "");
    } catch {
      return raw.replace(/\/$/, "");
    }
  }

  const port = Number(process.env.PORT) || 4000;
  return `http://localhost:${port}/api/auth/google/callback`;
}

/** Pathname only, e.g. /google/callback or /api/auth/google/callback */
export function getGoogleCallbackPathname() {
  try {
    return new URL(getGoogleCallbackUrl()).pathname;
  } catch {
    return "/api/auth/google/callback";
  }
}

export function warnIfSearchConsolePhpUrl() {
  const signin = process.env.GOOGLE_SIGNIN_URL?.trim();
  if (signin && /\.php|search_consol/i.test(signin)) {
    console.warn(
      "[Google OAuth] GOOGLE_SIGNIN_URL points at a PHP path — ignored by this Express API. Use GOOGLE_REDIRECT_URI for the Node callback only."
    );
  }
}

export function logGoogleOAuthDevHints() {
  if (process.env.NODE_ENV === "production") return;
  try {
    const cb = getGoogleCallbackUrl();
    const u = new URL(cb);
    const port = u.port || process.env.PORT || "8000";
    console.log(
      `[Google OAuth] Passport callbackURL: ${cb}\n` +
        `  → Frontend VITE_API_URL must be http://${u.hostname}:${port}/ (same hostname as above; localhost and 127.0.0.1 are different).`
    );
  } catch {
    /* ignore */
  }
}

/**
 * Aligns with typical Google Cloud mistakes (multiple secrets, wrong redirect entries).
 */
export function warnGoogleCloudClientSetup() {
  if (!process.env.GOOGLE_CLIENT_ID) return;

  let apiOriginHint = "http://127.0.0.1:8000";
  let localhostApiOrigin = "http://localhost:8000";
  try {
    const u = new URL(getGoogleCallbackUrl());
    apiOriginHint = `${u.protocol}//${u.host}`;
    const p = u.port || (u.protocol === "https:" ? "443" : "80");
    localhostApiOrigin = `${u.protocol}//localhost:${p}`;
  } catch {
    /* keep defaults */
  }

  console.log(
    "[Google OAuth] Console checklist: (1) Disable old client secrets — only one enabled. " +
      "(2) Authorized redirect URIs must include the exact string logged as callback URL (scheme + host + port + path). " +
      "localhost and 127.0.0.1 count as different hosts — add both redirect URIs if you use both. " +
      `(3) Authorized JavaScript origins: include ${apiOriginHint}, ${localhostApiOrigin}, and http://localhost:5173.`
  );

  try {
    const cb = getGoogleCallbackUrl();
    const u = new URL(cb);
    if (u.pathname !== "/google/callback") {
      console.warn(
        `[Google OAuth] Expected pathname /google/callback; got "${u.pathname}".`
      );
    }
  } catch {
    /* ignore */
  }
}
