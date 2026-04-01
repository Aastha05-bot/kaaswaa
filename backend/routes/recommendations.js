// routes/recommendations.js
// Mount this in your server as: app.use("/api/recommendations", require("./routes/recommendations"));

const express = require("express");
const router  = express.Router();
const db      = require("../db"); // adjust to your DB connection path

/**
 * GET /api/recommendations/:product_id
 *
 * Returns up to 4 products from the SAME category as the given product,
 * ranked by average rating (descending), excluding the product itself.
 *
 * Response shape:
 * [
 *   {
 *     product_id, product_name, description, price, tag,
 *     image_url, category_name,
 *     avg_rating,   // null if no reviews yet
 *     review_count
 *   },
 *   ...
 * ]
 */
router.get("/:product_id", async (req, res) => {
  const { product_id } = req.params;

  try {
    // Step 1: get the category_id of the requested product
    const [productRows] = await db.query(
      "SELECT category_id FROM product WHERE product_id = ?",
      [product_id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { category_id } = productRows[0];

    // Step 2: fetch up to 4 sibling products, ranked by avg rating
    const [rows] = await db.query(
      `SELECT
         p.product_id,
         p.product_name,
         p.description,
         p.price,
         p.tag,
         p.image_url,
         c.category_name,
         ROUND(AVG(f.ratings), 1)  AS avg_rating,
         COUNT(f.feedback_id)       AS review_count
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
      [category_id, product_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /recommendations/:product_id", err);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

module.exports = router;