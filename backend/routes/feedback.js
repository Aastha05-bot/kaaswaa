const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");
const multer      = require("multer");
const path        = require("path");

// MULTER SETUP FOR REVIEWS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = path.join(__dirname, "../uploads/reviews/");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "review-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// GET /api/feedback/:product_id — public, no auth needed
router.get("/:product_id", (req, res) => {
  const { product_id } = req.params;

  db.query(
    `SELECT
       f.feedback_id,
       f.product_id,
       f.comment,
       f.ratings,
       f.feedback_date,
       f.image_url,
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

// GET /api/feedback/user/:userId — Fetch reviews submitted by a specific user
router.get("/user/:userId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    `SELECT
       f.feedback_id,
       f.product_id,
       f.comment,
       f.ratings,
       f.feedback_date,
       f.image_url,
       p.product_name,
       p.image_url AS product_image
     FROM feedback f
     JOIN product p ON f.product_id = p.product_id
     WHERE f.user_id = ?
     ORDER BY f.feedback_date DESC`,
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error("GET /feedback/user", err);
        return res.status(500).json({ message: "Failed to fetch your reviews" });
      }
      res.json(results);
    }
  );
});

// POST /api/feedback — auth required
router.post("/", verifyToken, upload.single("review_image"), (req, res) => {
  try {
    const fs = require('fs');
    // Simplified debug log to avoid potential stringify issues
    const debugInfo = `[${new Date().toISOString()}] PRODUCT: ${req.body.product_id} | RATE: ${req.body.ratings} | HAS_FILE: ${!!req.file}\n`;
    fs.appendFileSync(path.join(__dirname, '../feedback_debug.log'), debugInfo);

    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const { product_id, comment = "", ratings } = req.body;
    const image_url = req.file ? `/uploads/reviews/${req.file.filename}` : null;
    const ratingVal = parseInt(ratings);

    if (!product_id || isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ message: "product_id and a valid rating (1-5) are required" });
    }

    // Check for duplicate review
    db.query(
      "SELECT feedback_id FROM feedback WHERE user_id = ? AND product_id = ?",
      [user_id, product_id],
      (err, existing) => {
        if (err) {
          console.error("POST /feedback duplicate check error:", err);
          fs.appendFileSync(path.join(__dirname, '../feedback_crash.log'), `DB ERR (DUP): ${err.message}\n`);
          return res.status(500).json({ message: "Failed to submit review", error: err.message });
        }
        if (existing.length > 0) {
          return res.status(409).json({ message: "You have already reviewed this product" });
        }

        // Insert review
        db.query(
          `INSERT INTO feedback (user_id, product_id, comment, ratings, feedback_date, image_url)
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [user_id, product_id, comment.trim(), ratingVal, image_url],
          (err) => {
            if (err) {
              console.error("POST /feedback insert error:", err);
              fs.appendFileSync(path.join(__dirname, '../feedback_crash.log'), `DB ERR (INSERT): ${err.message}\n`);
              return res.status(500).json({ message: "Failed to submit review", error: err.message });
            }
            res.status(201).json({ message: "Review submitted successfully" });
          }
        );
      }
    );
  } catch (crash) {
    console.error("CRITICAL CRASH in /feedback:", crash);
    require('fs').appendFileSync(path.join(__dirname, '../feedback_crash.log'), `CRASH: ${crash.stack}\n`);
    res.status(500).json({ message: "Internal server error during review submission", error: crash.message });
  }
});

// DELETE /api/feedback/:feedback_id — auth required
router.delete("/:feedback_id", verifyToken, (req, res) => {
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

module.exports = router;