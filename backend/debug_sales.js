const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kaaswaa",
});

db.connect();

const queries = [
  "SELECT COUNT(*) as total_orders FROM orders",
  "SELECT COUNT(*) as total_order_items FROM order_items",
  "SELECT COUNT(*) as total_products FROM product",
  "SELECT COUNT(*) as total_categories FROM category",
  "SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status",
  `SELECT 
        c.category_name, 
        SUM(oi.quantity) as total_sold, 
        SUM(oi.price * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN product p ON oi.product_id = p.product_id
      JOIN category c ON p.category_id = c.category_id
      GROUP BY c.category_id`
];

async function run() {
  for (const q of queries) {
    try {
      const [rows] = await db.promise().query(q);
      console.log(`Query: ${q}`);
      console.log(JSON.stringify(rows, null, 2));
      console.log("-------------------");
    } catch (e) {
      console.error(`Error in query: ${q}`);
      console.error(e.message);
    }
  }
  process.exit(0);
}

run();
