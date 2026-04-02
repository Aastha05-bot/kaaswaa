const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

// ── GET /api/cart/:userId  (protected) ───────────────────
// Returns user's cart with items joined to product info
router.get("/cart/:userId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const sql = `
    SELECT
      c.cart_id,
      c.user_id,
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      p.product_name,
      p.price,
      p.image_url,
      cat.category_name
    FROM cart c
    JOIN cart_items ci       ON c.cart_id      = ci.cart_id
    JOIN product p           ON ci.product_id  = p.product_id
    LEFT JOIN category cat   ON p.category_id  = cat.category_id
    WHERE c.user_id = ?
    ORDER BY ci.cart_item_id DESC
  `;
  db.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch cart." });
    res.json(results);
  });
});

// Helper function to get or create a cart for a user
const getOrCreateCart = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT cart_id FROM cart WHERE user_id = ?", [user_id], (err, rows) => {
      if (err) return reject(err);
      if (rows.length > 0) return resolve(rows[0].cart_id);
      
      db.query("INSERT INTO cart (user_id, total_amount) VALUES (?, 0)", [user_id], (err2, result) => {
        if (err2) return reject(err2);
        resolve(result.insertId);
      });
    });
  });
};

// ── POST /api/cart/add  (protected) ──────────────────────────
router.post("/cart/add", verifyToken, async (req, res) => {
  const { user_id, product_id, quantity = 1 } = req.body;

  if (!user_id || !product_id) return res.status(400).json({ message: "user_id and product_id are required." });
  if (parseInt(user_id) !== req.user.id) return res.status(403).json({ message: "Forbidden." });

  try {
    const cartId = await getOrCreateCart(user_id);

    // Check if product is already in cart
    db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err, rows) => {
      if (err) return res.status(500).json({ message: "DB Error." });

      if (rows.length > 0) {
        // Update quantity
        const newQty = rows[0].quantity + quantity;
        db.query("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?", [newQty, rows[0].cart_item_id], (err2) => {
          if (err2) return res.status(500).json({ message: "Failed to update cart." });
          res.json({ message: "Cart updated.", quantity: newQty });
        });
      } else {
        // Insert new item
        db.query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)", [cartId, product_id, quantity], (err2) => {
          if (err2) return res.status(500).json({ message: "Failed to add to cart." });
          res.status(201).json({ message: "Added to cart." });
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process cart request." });
  }
});

// ── PUT /api/cart/update  (protected) ──────────────────────────
router.put("/cart/update", verifyToken, async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  if (!user_id || !product_id || quantity === undefined) return res.status(400).json({ message: "Missing fields" });
  if (parseInt(user_id) !== req.user.id) return res.status(403).json({ message: "Forbidden." });

  try {
    const cartId = await getOrCreateCart(user_id);
    if (quantity <= 0) {
      db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete item" });
        return res.json({ message: "Item removed" });
      });
    } else {
      db.query("UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?", [quantity, cartId, product_id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update quantity" });
        return res.json({ message: "Quantity updated", quantity });
      });
    }
  } catch(error) {
    res.status(500).json({ message: "Error processing request" });
  }
});

// ── DELETE /api/cart/remove/:userId/:productId  (protected) ────────────────
router.delete("/cart/remove/:userId/:productId", verifyToken, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) return res.status(403).json({ message: "Forbidden." });

  try {
    const cartId = await getOrCreateCart(req.params.userId);
    db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, req.params.productId], (err) => {
      if (err) return res.status(500).json({ message: "Failed to remove item." });
      res.json({ message: "Item removed." });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── DELETE /api/cart/clear/:userId  (protected) ────────────────
router.delete("/cart/clear/:userId", verifyToken, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) return res.status(403).json({ message: "Forbidden." });
  
  try {
    const cartId = await getOrCreateCart(req.params.userId);
    db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId], (err) => {
      if (err) return res.status(500).json({ message: "Failed to clear cart." });
      res.json({ message: "Cart cleared." });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;