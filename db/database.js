// src/db/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../../sessions.db");
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
	db.run(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      device_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	db.run(`CREATE INDEX IF NOT EXISTS idx_email ON active_sessions(email)`);
	db.run(
		`CREATE INDEX IF NOT EXISTS idx_token ON active_sessions(session_token)`
	);
});

// Promise wrappers
const dbRun = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) reject(err);
			else resolve({lastID: this.lastID, changes: this.changes});
		});
	});
};

const dbGet = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
};

const dbAll = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
};

module.exports = {db, dbRun, dbGet, dbAll};
