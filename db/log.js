const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

// Create tables including admins
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // Insert default admin if not exists (username: admin, password: admin123)
  const bcrypt = require('bcrypt');
  const defaultUsername = 'admin';
  const defaultPassword = 'admin123';

  db.get("SELECT * FROM admins WHERE username = ?", [defaultUsername], (err, row) => {
    if (err) throw err;
    if (!row) {
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) throw err;
        db.run("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [defaultUsername, hash]);
      });
    }
  });

  // ... other table setups for products, orders, reviews, logs
});

module.exports = db;
