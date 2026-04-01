const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/:product_id", (req, res) => {
  const { product_id } = req.params;

  // Step 1: get category_id of the product
  db.query(
    "SELECT category_id FROM product WHERE product_id = ?",
    [product_id],
    (err, productRows) => {
      if (err) {
        console.error("GET /recommendations - step1", err);
        return res.status(500).json({ message: "Failed to fetch recommendations" });
      }
      if (productRows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const { category_id } = productRows[0];

      // Step 2: fetch sibling products ranked by avg rating
      db.query(
        `SELECT
           p.product_id,
           p.product_name,
           p.description,
           p.price,
           p.tag,
           p.image_url,
           c.category_name,
           ROUND(AVG(f.ratings), 1) AS avg_rating,
           COUNT(f.feedback_id)     AS review_count
         FROM product p
         LEFT JOIN category c ON p.category_id = c.category_id
         LEFT JOIN feedback f ON f.product_id  = p.product_id
         WHERE p.category_id = ?
           AND p.product_id  <> ?
         GROUP BY
           p.product_id, p.product_name, p.description,
           p.price, p.tag, p.image_url, c.category_name
         ORDER BY avg_rating DESC, review_count DESC
         LIMIT 4`,
        [category_id, product_id],
        (err, rows) => {
          if (err) {
            console.error("GET /recommendations - step2", err);
            return res.status(500).json({ message: "Failed to fetch recommendations" });
          }
          res.json(rows);
        }
      );
    }
  );
});

module.exports = router;