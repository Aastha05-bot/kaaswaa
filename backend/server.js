const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/category");
const userRoutes = require("./routes/users");
const feedbackRoutes = require("./routes/Feedback");
const verifyToken = require("./middleware/auth");
const recommendationRoutes = require("./routes/recommendations");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api",productRoutes);
app.use("/api",categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedback",verifyToken, feedbackRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Kaa Swaa backend is running!" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});