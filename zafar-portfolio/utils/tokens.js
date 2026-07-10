// utils/tokens.js
const crypto = require('crypto');

// Returns { rawToken, tokenHash, expiry } — rawToken goes in the emailed link,
// only tokenHash is ever stored, so a leaked db.json doesn't leak usable reset tokens.
function createResetToken(ttlMinutes = 30) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiry = Date.now() + ttlMinutes * 60 * 1000;
  return { rawToken, tokenHash, expiry };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { createResetToken, hashToken };
