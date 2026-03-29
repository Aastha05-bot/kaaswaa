import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/Home.css";
import Header from "./Header";
import Footer from "./Footer";

function Home() {
  const navigate = useNavigate();

  // ── Auth ───────────────────────────────────────────────
  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  // ── State ──────────────────────────────────────────────
  const [wishlist,   setWishlist]   = useState([]);
  const [cart,       setCart]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);

  // ── Fetch categories from backend ──────────────────────
  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // ── Fetch bestselling products from backend ────────────
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        // Map DB fields to component fields
        const mapped = data.map((p) => ({
          id:       p.product_id,
          name:     p.product_name,
          price:    parseFloat(p.price),
          tag:      p.tag || "",
          image:    p.image_url || "/placeholder.jpg",
          category: p.category_name || "",
        }));
        // Show only bestsellers (max 4) on home page
        const bestsellers = mapped
          .filter((p) => p.tag === "Bestseller")
          .slice(0, 5);
        setProducts(bestsellers.length > 0 ? bestsellers : mapped.slice(0, 5));
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  // ── Auth guard ─────────────────────────────────────────
  const requireAuth = (action) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    action();
  };

  const toggleWishlist = (id) =>
    requireAuth(() =>
      setWishlist((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      )
    );

  const addToCart = (id) =>
    requireAuth(() => setCart((prev) => [...prev, id]));

  return (
    <div className="home-wrapper">

      {/* NAVBAR */}
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      {/* BANNER */}
      <section className="banner" id="home">
        <div className="banner-content">
          <p className="banner-sub">Handcrafted with love</p>
          <h1 className="banner-title">
            Crafted with<br /><span>माया</span>
          </h1>
          <p className="banner-desc">
            Unique handmade jewelry and crafts, made with care in every stitch and bead.
          </p>
          <div className="banner-btns">
            <Link to="/products" className="btn-primary">Shop Now</Link>
            <Link to="/categories" className="btn-outline">Explore</Link>
          </div>
        </div>
        <div className="banner-visual">
          <div className="banner-circle c1" />
          <div className="banner-circle c2" />
          <div className="banner-circle c3" />
          <div className="banner-blob" />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section categories-section" id="categories">
        <div className="section-header">
          <h2>Shop by Category</h2>
        </div>
        <div className="categories-grid">
          {categories.length === 0 ? (
            <p style={{ color: "var(--gray)", textAlign: "center", gridColumn: "1/-1" }}>
              Loading categories...
            </p>
          ) : (
            categories.map((cat, i) => (
              <div
                className="category-card"
                key={cat.category_id}
                style={{ animationDelay: `${i * 0.1}s`, cursor: "pointer" }}
                onClick={() => navigate(`/categories/${cat.category_id}`)}
              >
                <p className="cat-name">{cat.category_name}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BEST SELLING */}
      <section className="section bestselling-section" id="bestselling">
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <h2 style={{ margin: 0 }}>Best Selling</h2>
            <Link to="/products" className="btn-view-all"> View all </Link>
          </div>
        </div>

        <div className="products-grid">
          {products.length === 0 ? (
            <p style={{ color: "var(--gray)", gridColumn: "1/-1", textAlign: "center" }}>
              Loading products...
            </p>
          ) : (
            products.map((p, i) => (
              <div
                className="product-card"
                key={p.id}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="product-img" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} alt={p.name} />
                  {p.tag && <span className="product-tag">{p.tag}</span>}
                  <button
                    className={`wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                  >
                    {wishlist.includes(p.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="product-info">
                  <h3 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h3>
                  <p className="product-price">Rs. {p.price.toLocaleString()}</p>
                  <button className="add-cart-btn" onClick={() => addToCart(p.id)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default Home;