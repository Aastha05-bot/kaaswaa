const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const sendOTP = require("../utils/sendOTP");
const verifyAdmin = require("../middleware/verifyAdmin");
require("dotenv").config();

const router = express.Router();

const ADMIN_EMAIL = "kaaswaa45@gmail.com";

// REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  // Determine table and role
  let table, role;
  if (email === ADMIN_EMAIL) { table = "admins"; role = "admin"; }
  else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { table = "users"; role = "user"; }
  else return res.status(400).json({ message: "Please use a valid Gmail address" });

  const nameField = table === "admins" ? "admin_name" : "full_name";

  db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log("OTP generated:", otp);

    db.query(
      `INSERT INTO ${table} (${nameField}, email, password, otp_code, otp_expires, is_verified) VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, otp, otpExpires, false],
      async (err, result) => {
        if (err) {
          console.error("INSERT error:", err.message);
          return res.status(500).json({ message: "Registration failed: " + err.message });
        }
        try {
          await sendOTP(email, otp);
          console.log("OTP email sent to:", email);
          res.status(201).json({ message: "OTP sent to your email", email });
        } catch (emailErr) {
          console.error("Email error:", emailErr.message);
          res.status(500).json({ message: "Failed to send OTP: " + emailErr.message });
        }
      }
    );
  });
});

// VERIFY OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const table = email === ADMIN_EMAIL ? "admins" : "users";
  const idField = table === "admins" ? "admin_id" : "user_id";
  const nameField = table === "admins" ? "admin_name" : "full_name";
  const role = table === "admins" ? "admin" : "user";

  db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = results[0];

    if (user.otp_code !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > new Date(user.otp_expires))
      return res.status(400).json({ message: "OTP expired" });

    db.query(
      `UPDATE ${table} SET is_verified = TRUE, otp_code = NULL, otp_expires = NULL WHERE email = ?`,
      [email],
      (err) => {
        if (err) return res.status(500).json({ message: "Verification failed" });

        const token = jwt.sign(
          { id: user[idField], role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.json({ message: "Email verified!", token, role, username: user[nameField], email: user.email, user_id: user[idField] });
      }
    );
  });
});

// RESEND OTP
router.post("/resend-otp", (req, res) => {
  const { email } = req.body;
  const table = email === ADMIN_EMAIL ? "admins" : "users";

  db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = results[0];
    if (user.is_verified)
      return res.status(400).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    db.query(
      `UPDATE ${table} SET otp_code = ?, otp_expires = ? WHERE email = ?`,
      [otp, otpExpires, email],
      async (err) => {
        if (err) return res.status(500).json({ message: "Failed to resend OTP" });
        try {
          await sendOTP(email, otp);
          res.json({ message: "New OTP sent to your email" });
        } catch (emailErr) {
          res.status(500).json({ message: "Failed to send OTP: " + emailErr.message });
        }
      }
    );
  });
});

// LOGIN — checks admins, staff, users tables
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const tables = [
    { table: "admins", role: "admin", idField: "admin_id", nameField: "admin_name", needsVerify: true  },
    { table: "staff",  role: "staff", idField: "staff_id", nameField: "staff_name", needsVerify: false },
    { table: "users",  role: "user",  idField: "user_id",  nameField: "full_name",  needsVerify: true  },
  ];

  for (const { table, role, idField, nameField, needsVerify } of tables) {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }).catch(() => []);

    if (results.length > 0) {
      const user = results[0];

      if (needsVerify && !user.is_verified)
        return res.status(403).json({ message: "Please verify your email first" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: user[idField], role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({ token, role, username: user[nameField], email: user.email, user_id: user[idField] });
    }
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const tables = ["admins", "staff", "users"];
  
  for (const table of tables) {
    const results = await new Promise((resolve) => {
      db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, res) => {
        if (err) resolve([]); else resolve(res);
      });
    });

    if (results.length > 0) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      return db.query(
        `UPDATE ${table} SET otp_code = ?, otp_expires = ? WHERE email = ?`,
        [otp, otpExpires, email],
        async (err) => {
          if (err) return res.status(500).json({ message: "Failed to generate reset code" });
          try {
            await sendOTP(email, otp);
            return res.json({ message: "Password reset verification code sent to your email" });
          } catch (e) {
            return res.status(500).json({ message: "Failed to send email" });
          }
        }
      );
    }
  }

  return res.status(404).json({ message: "No account found with that email address" });
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });

  const tables = ["admins", "staff", "users"];
  
  for (const table of tables) {
    const results = await new Promise((resolve) => {
      db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, res) => {
        if (err) resolve([]); else resolve(res);
      });
    });

    if (results.length > 0) {
      const user = results[0];
      if (user.otp_code !== otp) return res.status(400).json({ message: "Invalid verification code" });
      if (new Date() > new Date(user.otp_expires)) return res.status(400).json({ message: "Verification code expired" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      return db.query(
        `UPDATE ${table} SET password = ?, otp_code = NULL, otp_expires = NULL WHERE email = ?`,
        [hashedPassword, email],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to reset password" });
          return res.json({ message: "Password successfully reset! You can now log in." });
        }
      );
    }
  }

  return res.status(404).json({ message: "User not found" });
});

// ADMIN — CREATE STAFF
router.post("/admin/create-staff", verifyAdmin, async (req, res) => {
  const { username, email, password, phone_number } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  db.query("SELECT * FROM staff WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO staff (staff_name, email, password, phone_number) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, phone_number || null],
      (err) => {
        if (err) return res.status(500).json({ message: "Failed to create staff: " + err.message });
        res.status(201).json({ message: "Staff account created successfully" });
      }
    );
  });
});

// ADMIN — GET ALL STAFF
router.get("/admin/staff", verifyAdmin, (req, res) => {
  db.query(
    "SELECT staff_id, staff_name, email, phone_number, created_at FROM staff",
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ADMIN — DELETE STAFF
router.delete("/admin/staff/:id", verifyAdmin, (req, res) => {
  db.query("DELETE FROM staff WHERE staff_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Staff account deleted" });
  });
});

module.exports = router;