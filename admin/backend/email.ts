import nodemailer from "nodemailer";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function createSignInEmail(to: string, url: string): Email {
  const href = url
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return {
    to,
    subject: "Your PTP Operations Suite sign-in link",
    text: `Sign in to PTP Operations Suite:\n\n${url}\n\nThis link expires in 15 minutes and can only be used once. If you didn’t request it, you can ignore this email.`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in to PTP Operations Suite</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fa;color:#1a2942;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;">
      <tr>
        <td align="center" style="padding:48px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:384px;text-align:left;">
            <tr><td>
              <p style="margin:0 0 24px;font-size:14px;font-weight:700;line-height:20px;color:#1e3a5f;">Pacific Toll Processing</p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:500;letter-spacing:-0.6px;line-height:32px;">Sign in to PTP Operations Suite</h1>
              <p style="margin:0 0 24px;color:#5a6b7d;font-size:14px;line-height:22px;">Use the button below to sign in to your workspace.</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td bgcolor="#1e3a5f" style="border-radius:4px;text-align:center;mso-padding-alt:10px 16px;">
                  <a href="${href}" style="display:inline-block;border:1px solid #1e3a5f;border-radius:4px;padding:10px 16px;background-color:#1e3a5f;color:#ffffff;font-size:14px;font-weight:500;line-height:20px;text-decoration:none;">Sign in to PTP</a>
                </td></tr>
              </table>
              <p style="margin:24px 0 0;color:#5a6b7d;font-size:12px;line-height:20px;">This link expires in 15 minutes and can only be used once.</p>
              <p style="margin:8px 0 0;color:#5a6b7d;font-size:12px;line-height:20px;">If you didn’t request this, you can ignore this email.</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export function createEmailSender() {
  const production = process.env.NODE_ENV === "production";
  if (production && (!process.env.SMTP_HOST || !process.env.EMAIL_FROM))
    throw new Error("SMTP_HOST and EMAIL_FROM are required in production");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: Number(
      process.env.SMTP_PORT || process.env.MAILPIT_SMTP_PORT || 1025,
    ),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
  return async (message: Email) => {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "PTP Operations Suite <login@crm.local>",
      ...message,
    });
  };
}
