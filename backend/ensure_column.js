const db = require("./db");

db.query("SHOW COLUMNS FROM feedback LIKE 'image_url'", (err, results) => {
  if (err) {
    console.error("Error checking columns:", err.message);
    db.end();
    return;
  }
  if (results.length === 0) {
    db.query("ALTER TABLE feedback ADD COLUMN image_url VARCHAR(255) DEFAULT NULL", (err) => {
      if (err) console.error("Error adding column:", err.message);
      else console.log("image_url column added successfully");
      db.end();
    });
  } else {
    console.log("image_url column already exists");
    db.end();
  }
});
