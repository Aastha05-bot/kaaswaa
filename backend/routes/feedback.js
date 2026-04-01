<<<<<<< HEAD
// routes/feedback.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/feedback/:product_id — fetch reviews for a product (no auth needed)
router.get("/:product_id", (req, res) => {
  const { product_id } = req.params;

  db.query(
    `SELECT
       f.feedback_id,
       f.product_id,
       f.comment,
       f.ratings,
       f.feedback_date,
       u.full_name
     FROM feedback f
     JOIN users u ON f.user_id = u.user_id
     WHERE f.product_id = ?
     ORDER BY f.feedback_date DESC`,
    [product_id],
    (err, results) => {
      if (err) {
        console.error("GET /feedback/:product_id", err);
        return res.status(500).json({ message: "Failed to fetch reviews" });
      }
      res.json(results);
    }
  );
});

// POST /api/feedback — submit a review (auth required via verifyToken middleware)
router.post("/", (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const { product_id, comment = "", ratings } = req.body;

  if (!product_id || !ratings || ratings < 1 || ratings > 5) {
    return res.status(400).json({ message: "product_id and a rating (1-5) are required" });
  }

  // Check for duplicate review
  db.query(
    "SELECT feedback_id FROM feedback WHERE user_id = ? AND product_id = ?",
    [user_id, product_id],
    (err, existing) => {
      if (err) {
        console.error("POST /feedback duplicate check", err);
        return res.status(500).json({ message: "Failed to submit review" });
      }
      if (existing.length > 0) {
        return res.status(409).json({ message: "You have already reviewed this product" });
      }

      // Insert review
      db.query(
        `INSERT INTO feedback (user_id, product_id, comment, ratings, feedback_date)
         VALUES (?, ?, ?, ?, NOW())`,
        [user_id, product_id, comment.trim(), ratings],
        (err) => {
          if (err) {
            console.error("POST /feedback insert", err);
            return res.status(500).json({ message: "Failed to submit review" });
          }
          res.status(201).json({ message: "Review submitted successfully" });
        }
      );
    }
  );
});

// DELETE /api/feedback/:feedback_id — delete own review (auth required)
router.delete("/:feedback_id", (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  db.query(
    "DELETE FROM feedback WHERE feedback_id = ? AND user_id = ?",
    [req.params.feedback_id, user_id],
    (err, result) => {
      if (err) {
        console.error("DELETE /feedback/:feedback_id", err);
        return res.status(500).json({ message: "Failed to delete review" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Review not found or not yours" });
      }
      res.json({ message: "Review deleted" });
    }
  );
});

=======
// routes/feedback.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/feedback/:product_id — fetch reviews for a product (no auth needed)
router.get("/:product_id", (req, res) => {
  const { product_id } = req.params;

  db.query(
    `SELECT
       f.feedback_id,
       f.product_id,
       f.comment,
       f.ratings,
       f.feedback_date,
       u.full_name
     FROM feedback f
     JOIN users u ON f.user_id = u.user_id
     WHERE f.product_id = ?
     ORDER BY f.feedback_date DESC`,
    [product_id],
    (err, results) => {
      if (err) {
        console.error("GET /feedback/:product_id", err);
        return res.status(500).json({ message: "Failed to fetch reviews" });
      }
      res.json(results);
    }
  );
});

// POST /api/feedback — submit a review (auth required via verifyToken middleware)
router.post("/", (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  const { product_id, comment = "", ratings } = req.body;

  if (!product_id || !ratings || ratings < 1 || ratings > 5) {
    return res.status(400).json({ message: "product_id and a rating (1-5) are required" });
  }

  // Check for duplicate review
  db.query(
    "SELECT feedback_id FROM feedback WHERE user_id = ? AND product_id = ?",
    [user_id, product_id],
    (err, existing) => {
      if (err) {
        console.error("POST /feedback duplicate check", err);
        return res.status(500).json({ message: "Failed to submit review" });
      }
      if (existing.length > 0) {
        return res.status(409).json({ message: "You have already reviewed this product" });
      }

      // Insert review
      db.query(
        `INSERT INTO feedback (user_id, product_id, comment, ratings, feedback_date)
         VALUES (?, ?, ?, ?, NOW())`,
        [user_id, product_id, comment.trim(), ratings],
        (err) => {
          if (err) {
            console.error("POST /feedback insert", err);
            return res.status(500).json({ message: "Failed to submit review" });
          }
          res.status(201).json({ message: "Review submitted successfully" });
        }
      );
    }
  );
});

// DELETE /api/feedback/:feedback_id — delete own review (auth required)
router.delete("/:feedback_id", (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });

  db.query(
    "DELETE FROM feedback WHERE feedback_id = ? AND user_id = ?",
    [req.params.feedback_id, user_id],
    (err, result) => {
      if (err) {
        console.error("DELETE /feedback/:feedback_id", err);
        return res.status(500).json({ message: "Failed to delete review" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Review not found or not yours" });
      }
      res.json({ message: "Review deleted" });
    }
  );
});

>>>>>>> c8650a4 (update cart)
module.exports = router;