// db.js
const Database = require('better-sqlite3');
const db = new Database('familyportal.db');

// users: id, name(email), hash, role
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','member'))
);
`).run();

// links: id, title, href, created_at
db.prepare(`
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`).run();

// ensure at least one admin exists (default credentials)
const row = db.prepare(`SELECT COUNT(*) as c FROM users`).get();
if (row.c === 0) {
  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (name, hash, role) VALUES (?, ?, 'admin')`)
    .run('admin@local', hash);
  console.log('Created default admin: admin@local / admin123');
}


module.exports = db;
