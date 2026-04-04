const mysql = require("mysql2");
require("dotenv").config({ path: "./backend/.env" });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const testAdminOrders = () => {
    console.log("--- Testing Admin Orders Query ---");
    const sql = `
        SELECT o.order_id, o.order_date, o.order_status, o.total, o.user_id,
               u.full_name AS user_name,
               s.city, s.address, s.phone,
               p.payment_method
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN shipping_info s ON o.order_id = s.order_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        ORDER BY o.order_id DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error("ADMIN QUERY FAILED:", err.message);
            console.error("Details:", err);
        } else {
            console.log("ADMIN QUERY SUCCESS. Rows found:", rows.length);
        }
        testUserOrders();
    });
};

const testUserOrders = () => {
    console.log("\n--- Testing User Orders Query (User ID 24) ---");
    const sql = `
        SELECT o.order_id, o.order_date, o.order_status, o.total,
               s.city, s.address, s.phone, p.payment_method
        FROM orders o
        LEFT JOIN shipping_info s ON o.order_id = s.order_id
        LEFT JOIN payments p ON o.order_id = p.order_id
        WHERE o.user_id = 24
        ORDER BY o.order_id DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error("USER QUERY FAILED:", err.message);
            console.error("Details:", err);
        } else {
            console.log("USER QUERY SUCCESS. Rows found:", rows.length);
        }
        db.end();
    });
};

testAdminOrders();
