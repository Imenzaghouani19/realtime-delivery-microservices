const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "orders.db");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Error opening orders database:", error.message);
    } else {
        console.log("Orders database connected");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            pickup_address TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `);
});

module.exports = db;
