// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');
const { createResetToken, hashToken } = require('../utils/tokens');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const data = db.read();
  const admin = data.admin;

  if (!admin || !admin.passwordHash || admin.email.toLowerCase() !== String(email).toLowerCase()) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('admin_token', token, COOKIE_OPTS);
  res.json({ ok: true, email: admin.email });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', loginLimiter, async (req, res) => {
  const { email } = req.body || {};
  const data = db.read();
  const admin = data.admin;

  // Always respond the same way, whether or not the email matches —
  // this avoids leaking which emails exist on the system.
  const genericResponse = { ok: true, message: 'If that email is registered, a reset link has been sent.' };

  if (!admin || !admin.email || admin.email.toLowerCase() !== String(email || '').toLowerCase()) {
    return res.json(genericResponse);
  }

  const { rawToken, tokenHash, expiry } = createResetToken(30);
  admin.resetTokenHash = tokenHash;
  admin.resetTokenExpiry = expiry;
  db.write(data);

  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  const resetLink = `${baseUrl}/admin/reset-password.html?token=${rawToken}`;

  await sendMail({
    to: admin.email,
    subject: 'Reset your portfolio admin password',
    html: `
      <p>Hi Zafar,</p>
      <p>Click the link below to set a new admin password. This link expires in 30 minutes.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    text: `Reset your admin password: ${resetLink} (expires in 30 minutes)`
  });

  res.json(genericResponse);
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const data = db.read();
  const admin = data.admin;
  const incomingHash = hashToken(token);

  if (
    !admin ||
    !admin.resetTokenHash ||
    admin.resetTokenHash !== incomingHash ||
    !admin.resetTokenExpiry ||
    Date.now() > admin.resetTokenExpiry
  ) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.resetTokenHash = null;
  admin.resetTokenExpiry = null;
  db.write(data);

  res.json({ ok: true, message: 'Password updated. You can now log in.' });
});

// POST /api/auth/change-password  (while logged in)
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const data = db.read();
  const admin = data.admin;
  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  db.write(data);
  res.json({ ok: true });
});

// POST /api/auth/change-email  (while logged in)
router.post('/change-email', requireAuth, async (req, res) => {
  const { newEmail, currentPassword } = req.body || {};
  if (!newEmail || !currentPassword) {
    return res.status(400).json({ error: 'New email and current password are required.' });
  }
  const data = db.read();
  const admin = data.admin;
  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  admin.email = String(newEmail).trim().toLowerCase();
  db.write(data);

  // Refresh the session cookie so it matches the new email.
  const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('admin_token', token, COOKIE_OPTS);
  res.json({ ok: true, email: admin.email });
});

module.exports = router;
