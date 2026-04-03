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
// POST new product
router.post("/products", (req, res) => {
  const { product_name, description, price, category_id, tag, image_url } = req.body;
  
  if (!product_name || !price) {
    return res.status(400).json({ message: "Product name and price are required" });
  }

  const sql = `
    INSERT INTO product (product_name, description, price, category_id, tag, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [product_name, description || null, price, category_id || null, tag || null, image_url || null], (err, result) => {
    if (err) {
      console.error("Error creating product:", err);
      return res.status(500).json({ message: "Failed to create product" });
    }
    res.status(201).json({ message: "Product created successfully", product_id: result.insertId });
  });
});

// PUT update product
router.put("/products/:id", (req, res) => {
  const { product_name, description, price, category_id, tag, image_url } = req.body;
  const productId = req.params.id;

  if (!product_name || !price) {
    return res.status(400).json({ message: "Product name and price are required" });
  }

  const sql = `
    UPDATE product 
    SET product_name = ?, description = ?, price = ?, category_id = ?, tag = ?, image_url = ?
    WHERE product_id = ?
  `;

  db.query(sql, [product_name, description || null, price, category_id || null, tag || null, image_url || null, productId], (err, result) => {
    if (err) {
      console.error("Error updating product:", err);
      return res.status(500).json({ message: "Failed to update product" });
    }
    res.json({ message: "Product updated successfully" });
  });
});

// DELETE product
router.delete("/products/:id", (req, res) => {
  const productId = req.params.id;

  db.query("DELETE FROM product WHERE product_id = ?", [productId], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ message: "Failed to delete product" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

module.exports = router;