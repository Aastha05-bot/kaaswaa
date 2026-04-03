import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import "../Styles/Home.css";
import Header from "./Header";
import Footer from "./Footer";



const INSTAGRAM_USERNAME = "kaaswaa";

function Home() {
  const navigate = useNavigate();

  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const isLoggedIn = !!token;
  const { wishlist, addToCart, toggleWishlist } = useContext(ShopContext);

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [igTooltip,  setIgTooltip]  = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((p) => ({
          id:       p.product_id,
          name:     p.product_name,
          price:    parseFloat(p.price),
          tag:      p.tag || "",
          image:    p.image_url || "/placeholder.jpg",
          category: p.category_name || "",
        }));
        const bestsellers = mapped.filter((p) => p.tag === "Bestseller").slice(0, 5);
        setProducts(bestsellers.length > 0 ? bestsellers : mapped.slice(0, 5));
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  const requireAuth = (action) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    action();
  };
  const handleAddToCart = (id) =>
    requireAuth(() => addToCart(id, 1));
    
  const handleToggleWishlist = (id) =>
    requireAuth(() => toggleWishlist(id));

  return (
    <div className="home-wrapper">

      <Header isLoggedIn={isLoggedIn} username={username} />

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
                    className={`wishlist-btn ${wishlist.some(w => w.product_id === p.id) ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist(p.id); }}
                  >
                    {wishlist.some(w => w.product_id === p.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="product-info">
                  <h3 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h3>
                  <p className="product-price">Rs. {p.price.toLocaleString()}</p>
                  <button className="add-cart-btn" onClick={() => handleAddToCart(p.id)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />

      {/* ── FLOATING INSTAGRAM BUTTON ── */}
      <a
        className="ig-float"
        href={`https://www.instagram.com/direct/t/17843034852267435/?__pwa=1${INSTAGRAM_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIgTooltip(true)}
        onMouseLeave={() => setIgTooltip(false)}
        aria-label="Message us on Instagram"
      >
        {/* Tooltip label */}
        <span className={`ig-tooltip ${igTooltip ? "ig-tooltip--visible" : ""}`}>
          Message us on Instagram
        </span>

        {/* Instagram icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="white"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>

    </div>
  );
}

export default Home;
