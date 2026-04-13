const db = require("./db");

db.query("DESCRIBE feedback", (err, results) => {
  if (err) {
    console.error("Error describing feedback table:", err.message);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  db.end();
});
