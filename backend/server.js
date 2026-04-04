const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/category");
const userRoutes = require("./routes/users");
const feedbackRoutes = require("./routes/Feedback");
const verifyToken = require("./middleware/auth");
const recommendationRoutes = require("./routes/recommendations");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const wishlistRoutes = require("./routes/wishlist");
const paymentRoutes = require("./routes/payments");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", authRoutes);
app.use("/api",productRoutes);
app.use("/api",categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Kaa Swaa backend is running!" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});