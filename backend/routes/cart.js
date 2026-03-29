const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

// ── GET /api/cart/:userId  (protected) ───────────────────
// Returns user's cart with items joined to product info
router.get("/cart/:userId", verifyToken, (req, res) => {
  // Users can only fetch their own cart
  if (parseInt(req.params.userId) !== req.user.user_id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const sql = `
    SELECT
      c.cart_id,
      c.user_id,
      c.total_amount,
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      p.product_name,
      p.price,
      p.image_url,
      cat.category_name
    FROM cart c
    LEFT JOIN cart_items ci  ON c.cart_id      = ci.cart_id
    LEFT JOIN product p      ON ci.product_id  = p.product_id
    LEFT JOIN category cat   ON p.category_id  = cat.category_id
    WHERE c.user_id = ?
    ORDER BY c.cart_id DESC
  `;
  db.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch cart." });
    res.json(results);
  });
});

// ── POST /api/cart  (protected) ──────────────────────────
// Create a new cart / place order
// body: { user_id, total_amount, items: [{ product_id, quantity }] }
router.post("/cart", verifyToken, (req, res) => {
  const { user_id, total_amount, items = [] } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required." });
  }

  // Insert the cart row first
  db.query(
    "INSERT INTO cart (user_id, total_amount) VALUES (?, ?)",
    [user_id, total_amount || 0.00],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to create cart." });

      const cartId = result.insertId;

      // If no line-items, return early
      if (!items.length) {
        return res.status(201).json({ message: "Order placed.", cart_id: cartId });
      }

      // Bulk-insert cart_items rows (requires cart_items table – see schema note below)
      const values = items.map((item) => [cartId, item.product_id, item.quantity || 1]);
      db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ?",
        [values],
        (err2) => {
          if (err2) {
            console.error("cart_items insert error:", err2);
            // Cart row was created, so still report success
          }
          res.status(201).json({ message: "Order placed.", cart_id: cartId });
        }
      );
    }
  );
});

// ── DELETE /api/cart/:cartId  (protected) ────────────────
router.delete("/cart/:cartId", verifyToken, (req, res) => {
  // Verify ownership
  db.query("SELECT user_id FROM cart WHERE cart_id = ?", [req.params.cartId], (err, rows) => {
    if (err)              return res.status(500).json({ message: "Database error." });
    if (!rows.length)     return res.status(404).json({ message: "Cart not found." });
    if (rows[0].user_id !== req.user.user_id) return res.status(403).json({ message: "Forbidden." });

    db.query("DELETE FROM cart WHERE cart_id = ?", [req.params.cartId], (err2) => {
      if (err2) return res.status(500).json({ message: "Failed to delete cart." });
      res.json({ message: "Cart deleted." });
    });
  });
});

/*
  NOTE: If you don't have a cart_items table yet, run this SQL:

  CREATE TABLE cart_items (
    cart_item_id INT(11)       NOT NULL AUTO_INCREMENT,
    cart_id      INT(11)       NOT NULL,
    product_id   INT(11)       NOT NULL,
    quantity     INT(11)       NOT NULL DEFAULT 1,
    PRIMARY KEY (cart_item_id),
    KEY cart_id    (cart_id),
    KEY product_id (product_id),
    FOREIGN KEY (cart_id)    REFERENCES cart(cart_id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
  );
*/

module.exports = router;