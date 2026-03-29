import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../Styles/Categories.css";
import Header from "./Header";
import Footer from "./Footer";

function Categories() {
  const navigate = useNavigate();
  const { id } = useParams(); // optional — if coming from /categories/:id

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  const [categories,     setCategories]     = useState([]);
  const [products,       setProducts]       = useState([]);
  const [activeCategory, setActiveCategory] = useState(id ? parseInt(id) : 0); // 0 = All
  const [wishlist,       setWishlist]       = useState([]);
  const [cart,           setCart]           = useState([]);
  const [addedId,        setAddedId]        = useState(null);
  const [loadingCats,    setLoadingCats]    = useState(true);
  const [loadingProds,   setLoadingProds]   = useState(true);

  // ── Fetch categories ───────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoadingCats(false);
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        setLoadingCats(false);
      });
  }, []);

  // ── Fetch products ─────────────────────────────────────
  useEffect(() => {
    setLoadingProds(true);
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
        console.log("Products loaded:", mapped);
        setProducts(mapped);
        setLoadingProds(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoadingProds(false);
      });
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
    requireAuth(() => {
      setCart((prev) => [...prev, id]);
      setAddedId(id);
      setTimeout(() => setAddedId(null), 1500);
    });

  // ── Filter products by active category ────────────────
  const activeCategoryName = activeCategory === 0
    ? "All"
    : categories.find((c) => c.category_id === activeCategory)?.category_name || "All";

  const filtered = activeCategory === 0
    ? products
    : products.filter((p) => p.category === activeCategoryName);

  return (
    <div className="categories-page-wrapper">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      {/* ── HERO ── */}
      <section className="categories-hero">
        <p className="categories-hero-sub">Handcrafted with love</p>
        <h1 className="categories-hero-title">Shop by Category</h1>
      </section>

      <div className="categories-layout">

        {/* ── SIDEBAR ── */}
        <aside className="categories-sidebar">
          <h3 className="sidebar-title">Categories</h3>
          <ul className="sidebar-list">
            {loadingCats ? (
              <li className="sidebar-loading">Loading...</li>
            ) : (
              <>
                {/* All option */}
                <li
                  className={`sidebar-item ${activeCategory === 0 ? "active" : ""}`}
                  onClick={() => setActiveCategory(0)}
                >
                  All
                </li>
                {/* Category list from DB */}
                {categories.map((cat) => (
                  <li
                    key={cat.category_id}
                    className={`sidebar-item ${activeCategory === cat.category_id ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat.category_id)}
                  >
                    {cat.category_name}
                  </li>
                ))}
              </>
            )}
          </ul>
        </aside>

        {/* ── PRODUCTS ── */}
        <main className="categories-main">
          <div className="categories-main-header">
            <h2>{activeCategoryName}</h2>

          </div>

          {loadingProds ? (
            <div className="categories-empty"><p>Loading products...</p></div>
          ) : filtered.length === 0 ? (
            <div className="categories-empty">
              <p>No products found!!</p>
            </div>
          ) : (
            <div className="categories-grid-products">
              {filtered.map((p, i) => (
                <div
                  className="product-card"
                  key={p.id}
                  style={{ animationDelay: `${i * 0.06}s` }}
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
                    <button
                      className={`add-cart-btn ${addedId === p.id ? "added" : ""}`}
                      onClick={() => addToCart(p.id)}
                    >
                      {addedId === p.id ? "✓ Added!" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default Categories;