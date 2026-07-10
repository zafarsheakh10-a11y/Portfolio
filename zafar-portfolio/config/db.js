// config/db.js
// Tiny, dependency-free JSON-file datastore.
// Good enough for a single-admin personal portfolio; swap for MongoDB later if you ever need to.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.existsSync(SEED_PATH)
      ? JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'))
      : {};
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
  }
}

function read() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('db.json is corrupted: ' + e.message);
  }
}

// Simple write queue so concurrent saves never interleave and corrupt the file.
let writeChain = Promise.resolve();
function write(data) {
  writeChain = writeChain.then(() => {
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, DB_PATH);
  });
  return writeChain;
}

module.exports = { read, write, DB_PATH };
