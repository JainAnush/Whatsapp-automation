// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "followups.db");

// Creates or opens followups.db
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);

    // Create table if not exists
    db.run(
      `
      CREATE TABLE IF NOT EXISTS followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        campaignId TEXT NOT NULL,
        hasResponded INTEGER DEFAULT 0,
        followupCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          console.error("Failed to create table:", err.message);
        } else {
          console.log("followups table ready to roll!");
        }
      }
    );
  }
});

module.exports = db;
