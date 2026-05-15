const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "deliveries.db");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Error opening deliveries database:", error.message);
    } else {
        console.log("Deliveries database connected");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            driver_id INTEGER NOT NULL,
            pickup_address TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `);
});

module.exports = db;