import { clientUrl } from "./clientUrl.js";

const BG = "#0f172a";
const CARD = "#1e293b";
const TEXT = "#ffffff";
const MUTED = "#94a3b8";
const ACCENT = "#3b82f6";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout({ title, preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || "")}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:${CARD};border-radius:12px;border:1px solid #334155;">
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <div style="font-size:20px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">ResumeXpert</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 28px 24px;color:${TEXT};font-size:15px;line-height:1.55;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <div style="border-top:1px solid #334155;padding-top:16px;color:${MUTED};font-size:12px;">
                You received this because of activity on ResumeXpert.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href, label) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">${escapeHtml(label)}</a>`;
}

export function welcomeTemplate(userName) {
  const loginHref = `${clientUrl()}/login`;
  const name = String(userName || "there").trim() || "there";
  return layout({
    title: "Welcome to ResumeXpert",
    preheader: "Build resumes and run ATS checks.",
    bodyHtml: `
      <p style="margin:0 0 12px 0;color:${TEXT};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px 0;color:${MUTED};">Welcome to <strong style="color:${TEXT};">ResumeXpert</strong>. Here is what you can do:</p>
      <ul style="margin:0 0 16px 0;padding-left:20px;color:${MUTED};">
        <li style="margin-bottom:8px;">Build professional, ATS-friendly resumes.</li>
        <li style="margin-bottom:8px;">Use the <strong style="color:${TEXT};">ATS checker</strong> to see how your resume scores.</li>
        <li>Export and share when you are ready.</li>
      </ul>
      ${button(loginHref, "Log in")}
      <p style="margin:16px 0 0 0;color:${MUTED};font-size:13px;word-break:break-all;">${escapeHtml(loginHref)}</p>
    `,
  });
}

export function welcomeWithCredentialsTemplate(userName, email, password, loginUrl) {
  const name = String(userName || "there").trim() || "there";
  const href = loginUrl || `${clientUrl()}/login`;
  return layout({
    title: "Your ResumeXpert account",
    preheader: "An admin created your account.",
    bodyHtml: `
      <p style="margin:0 0 12px 0;color:${TEXT};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px 0;color:${MUTED};">Your account has been created by an administrator. Use the credentials below to sign in:</p>
      <div style="background:#0f172a;border:1px solid #475569;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px 0;color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
        <p style="margin:0 0 12px 0;color:${TEXT};font-size:14px;word-break:break-all;">${escapeHtml(email)}</p>
        <p style="margin:0 0 8px 0;color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Temporary password</p>
        <p style="margin:0;color:${TEXT};font-size:14px;font-family:ui-monospace,monospace;">${escapeHtml(password)}</p>
      </div>
      ${button(href, "Log in")}
      <p style="margin:16px 0 0 0;color:${MUTED};font-size:13px;">Please change your password after your first login.</p>
    `,
  });
}

function formatIst(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function adminNewUserTemplate(userEmail, userName, createdBy, time) {
  const t = formatIst(time);
  return layout({
    title: "New user — ResumeXpert",
    preheader: `New user: ${userEmail}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;color:${TEXT};font-size:16px;font-weight:600;">New user</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:${MUTED};width:100px;">Name</td><td style="padding:6px 0;color:${TEXT};">${escapeHtml(userName || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:${MUTED};">Email</td><td style="padding:6px 0;color:${TEXT};word-break:break-all;">${escapeHtml(userEmail || "")}</td></tr>
        <tr><td style="padding:6px 0;color:${MUTED};">Created by</td><td style="padding:6px 0;color:${TEXT};">${escapeHtml(createdBy || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:${MUTED};">Time (IST)</td><td style="padding:6px 0;color:${TEXT};">${escapeHtml(t)}</td></tr>
      </table>
    `,
  });
}
