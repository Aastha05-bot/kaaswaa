const db = require("./db");

async function migrate() {
  const sql = "ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER message";
  
  db.query(sql, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("Column 'is_read' already exists. Migration skipped.");
      } else {
        console.error("Migration failed:", err);
      }
    } else {
      console.log("Column 'is_read' added successfully to 'notifications' table.");
    }
    process.exit();
  });
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
