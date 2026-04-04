const mysql = require("mysql2");
require("dotenv").config({ path: "./backend/.env" });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sql = "ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INT;";

db.query(sql, (err) => {
  if (err) {
    if (err.code === "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log("Column already exists.");
    } else {
        console.error("Migration failed:", err.message);
    }
  } else {
    console.log("Successfully added address_id to orders table.");
  }
  db.end();
});
