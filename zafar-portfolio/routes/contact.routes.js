// routes/contact.routes.js
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const db = require('../config/db');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many messages sent. Please try again later.' }
});

// POST /api/contact — public
router.post('/', contactLimiter, async (req, res) => {
  const { name, email, message, company } = req.body || {};

  // Honeypot: real visitors never fill this hidden field.
  if (company) {
    return res.json({ ok: true }); // pretend success, drop silently
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are all required.' });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (String(message).length > 4000) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  const data = db.read();
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    message: String(message).slice(0, 4000),
    read: false,
    createdAt: new Date().toISOString()
  };
  data.messages.unshift(entry);
  db.write(data);

  const notifyTo = (data.admin && data.admin.email) || data.site.contact.email;
  await sendMail({
    to: notifyTo,
    subject: `New portfolio message from ${entry.name}`,
    html: `
      <p><b>Name:</b> ${entry.name}</p>
      <p><b>Email:</b> ${entry.email}</p>
      <p><b>Message:</b></p>
      <p>${entry.message.replace(/\n/g, '<br>')}</p>
    `,
    text: `Name: ${entry.name}\nEmail: ${entry.email}\n\n${entry.message}`
  });

  res.json({ ok: true, message: "Thanks — I'll get back to you soon." });
});

module.exports = router;
