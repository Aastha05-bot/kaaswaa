const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

/*
  Requires a wishlist table:

  CREATE TABLE wishlist (
    wishlist_id INT(11)  NOT NULL AUTO_INCREMENT,
    user_id     INT(11)  NOT NULL,
    product_id  INT(11)  NOT NULL,
    added_at    TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (wishlist_id),
    UNIQUE KEY unique_wish (user_id, product_id),
    KEY product_id (product_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)      ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
  );
*/

// ── GET /api/wishlist/:userId  (protected) ────────────────
router.get("/wishlist/:userId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const sql = `
    SELECT
      w.wishlist_id,
      w.product_id,
      w.created_at,
      p.product_name,
      p.price,
      p.image_url,
      p.tag,
      c.category_name
    FROM wishlist w
    JOIN product  p ON w.product_id  = p.product_id
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `;
  db.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch wishlist." });
    res.json(results);
  });
});

// ── POST /api/wishlist  (protected) ──────────────────────
// body: { user_id, product_id }
router.post("/wishlist", verifyToken, (req, res) => {
  const { user_id, product_id } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ message: "user_id and product_id are required." });
  }

  // INSERT IGNORE avoids duplicate error on the unique constraint
  db.query(
    "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
    [user_id, product_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to add to wishlist." });
      if (result.affectedRows === 0) {
        return res.status(409).json({ message: "Product already in wishlist." });
      }
      res.status(201).json({ message: "Added to wishlist.", wishlist_id: result.insertId });
    }
  );
});

// ── DELETE /api/wishlist/:userId/:productId  (protected) ──
router.delete("/wishlist/:userId/:productId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  db.query(
    "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
    [req.params.userId, req.params.productId],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to remove from wishlist." });
      res.json({ message: "Removed from wishlist." });
    }
  );
});

module.exports = router;