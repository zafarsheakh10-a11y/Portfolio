// utils/mailer.js
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return null; // Email not configured yet — callers must handle this gracefully.
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: Number(EMAIL_PORT) || 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });

  return transporter;
}

// Never throws — logs and returns { sent:false, reason } instead, so a missing/broken
// email config never breaks the contact form or password-reset flow for the visitor/admin.
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[mailer] EMAIL_USER / EMAIL_PASS not set in .env — skipping send. Subject:', subject);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await t.sendMail({
      from: `"${process.env.SITE_NAME || 'Portfolio'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
