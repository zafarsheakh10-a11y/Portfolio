// routes/messages.routes.js
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/messages
router.get('/', (req, res) => {
  const data = db.read();
  res.json({ messages: data.messages });
});

// PATCH /api/messages/:id  (mark read/unread)
router.patch('/:id', (req, res) => {
  const data = db.read();
  const msg = data.messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });
  if (typeof req.body.read === 'boolean') msg.read = req.body.read;
  db.write(data);
  res.json({ ok: true });
});

// DELETE /api/messages/:id
router.delete('/:id', (req, res) => {
  const data = db.read();
  const before = data.messages.length;
  data.messages = data.messages.filter(m => m.id !== req.params.id);
  if (data.messages.length === before) return res.status(404).json({ error: 'Message not found.' });
  db.write(data);
  res.json({ ok: true });
});

module.exports = router;
