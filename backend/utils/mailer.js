import nodemailer from "nodemailer";
import {
  welcomeTemplate,
  welcomeWithCredentialsTemplate,
  adminNewUserTemplate,
} from "./emailTemplates.js";

let transporter = null;

function getTransporter() {
  const user = process.env.MAIL_FROM?.trim();
  const pass = process.env.MAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }
  return transporter;
}

function stripTags(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function deliver({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[mailer] MAIL_FROM / MAIL_APP_PASSWORD not set — skipped:",
        subject
      );
    }
    return;
  }
  const fromAddr = process.env.MAIL_FROM.trim();
  const from =
    process.env.MAIL_FROM_DISPLAY_NAME?.trim()
      ? `"${process.env.MAIL_FROM_DISPLAY_NAME.trim()}" <${fromAddr}>`
      : `"ResumeXpert" <${fromAddr}>`;
  await t.sendMail({
    from,
    to,
    subject,
    html,
    text: text ?? stripTags(html),
  });
}

/**
 * Low-level send (throws on failure). Prefer named helpers below for auth flows.
 */
export async function sendMail(opts) {
  return deliver(opts);
}

export function sendWelcomeEmail(toEmail, userName) {
  try {
    const html = welcomeTemplate(userName);
    return deliver({
      to: toEmail,
      subject: "Welcome to ResumeXpert 🎉",
      html,
    }).catch(console.error);
  } catch (e) {
    console.error("[sendWelcomeEmail]", e);
  }
}

export function sendWelcomeWithCredentials(toEmail, userName, password, loginUrl) {
  try {
    const html = welcomeWithCredentialsTemplate(
      userName,
      toEmail,
      password,
      loginUrl
    );
    return deliver({
      to: toEmail,
      subject: "Your ResumeXpert account is ready",
      html,
    }).catch(console.error);
  } catch (e) {
    console.error("[sendWelcomeWithCredentials]", e);
  }
}

export function sendAdminNewUserNotification(userEmail, userName, createdBy) {
  const admin = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (!admin) return;
  try {
    const html = adminNewUserTemplate(
      userEmail,
      userName,
      createdBy,
      new Date()
    );
    return deliver({
      to: admin,
      subject: "New user — ResumeXpert",
      html,
    }).catch(console.error);
  } catch (e) {
    console.error("[sendAdminNewUserNotification]", e);
  }
}
