// server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const contactRoutes = require('./routes/contact.routes');
const messagesRoutes = require('./routes/messages.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- core middleware ----
app.use(express.json({ limit: '12mb' })); // generous enough for a few base64 images
app.use(cookieParser());

// ---- static frontend ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- api routes ----
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- 404 for unmatched API routes ----
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// ---- friendly fallback for everything else -> public site ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- central error handler (keeps the server alive, never leaks stack traces) ----
app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// ---- first-boot admin bootstrap ----
function bootstrapAdmin() {
  const data = db.read();

  if (data.admin && data.admin.passwordHash) {
    return; // already set up
  }

  const email = process.env.ADMIN_EMAIL;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !initialPassword) {
    console.warn('\n⚠  No admin account exists yet, and ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD are not set in .env.');
    console.warn('   Set both in your .env file and restart the server to create your admin login.\n');
    return;
  }

  const passwordHash = bcrypt.hashSync(initialPassword, 12);
  data.admin = {
    email: email.trim().toLowerCase(),
    passwordHash,
    resetTokenHash: null,
    resetTokenExpiry: null,
    createdAt: new Date().toISOString()
  };
  db.write(data);
  console.log(`\n✔ Admin account created for ${data.admin.email}. You can log in at /admin now.\n`);
}

bootstrapAdmin();

app.listen(PORT, () => {
  console.log(`\nZafar Sheikh portfolio server running → http://localhost:${PORT}`);
  console.log(`Admin panel                          → http://localhost:${PORT}/admin\n`);
});

module.exports = app;
