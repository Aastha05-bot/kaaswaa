const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all products with category name
router.get("/products", (req, res) => {
  const sql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.description,
      p.price,
      p.tag,
      p.image_url,
      c.category_name
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
    res.json(results);
  });
});

// GET single product by ID
router.get("/products/:id", (req, res) => {
  const sql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.description,
      p.price,
      p.tag,
      p.image_url,
      c.category_name
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE p.product_id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(results[0]);
  });
});

module.exports = router;