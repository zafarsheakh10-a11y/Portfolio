// routes/content.routes.js
const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { THEME_PRESETS, TYPOGRAPHY_PRESETS, FONT_SCALES } = require('../utils/themes');

const router = express.Router();

const ALLOWED_SECTIONS = new Set([
  'hero', 'about', 'journey', 'craft', 'education',
  'languages', 'projects', 'contact', 'theme', 'footerNote', 'brandName'
]);

// Sections whose value should be replaced outright rather than shallow-merged
// (arrays, or plain string fields).
const REPLACE_WHOLESALE = new Set(['journey', 'craft', 'languages', 'projects', 'footerNote', 'brandName']);

// GET /api/content — public, powers the live site
router.get('/', (req, res) => {
  const data = db.read();
  res.json({ site: data.site });
});

// GET /api/meta — public, theme/typography/font-scale option catalogues
router.get('/meta/presets', (req, res) => {
  res.json({ themePresets: THEME_PRESETS, typographyPresets: TYPOGRAPHY_PRESETS, fontScales: FONT_SCALES });
});

// PUT /api/content/:section — admin only
router.put('/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  if (!ALLOWED_SECTIONS.has(section)) {
    return res.status(400).json({ error: `Unknown section "${section}".` });
  }

  const data = db.read();
  const incoming = req.body;

  if (REPLACE_WHOLESALE.has(section)) {
    data.site[section] = incoming;
  } else {
    data.site[section] = { ...data.site[section], ...incoming };
  }

  db.write(data);
  res.json({ ok: true, site: data.site });
});

module.exports = router;
