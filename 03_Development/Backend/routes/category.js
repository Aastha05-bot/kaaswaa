const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all categories
router.get("/categories", (req, res) => {
  const sql = "SELECT * FROM category";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ message: "Failed to fetch categories" });
    }
    res.json(results);
  });
});

module.exports = router;