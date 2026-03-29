import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/ProductDetail.css";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cart,     setCart]     = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));
  const [qty,      setQty]      = useState(1);
  const [added,    setAdded]    = useState(false);
  const [reviews,  setReviews]  = useState([]);

  /* ---------- fetch product ---------- */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res  = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProduct({
          id:          data.product_id,
          name:        data.product_name,
          price:       parseFloat(data.price),
          category:    data.category_name || "General",
          tag:         data.tag || "",
          image:       data.image_url || "/placeholder.jpg",
          description: data.description || "",
        });
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  /* ---------- fetch reviews ---------- */
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/feedback/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setReviews(data);
      } catch { /* silent */ }
    };
    fetchReviews();
  }, [id]);

  /* ---------- persist cart / wishlist ---------- */
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("cart",     JSON.stringify(cart));     }, [cart]);

  const requireAuth = (action) => { if (!isLoggedIn) { navigate("/login"); return; } action(); };

  const toggleWishlist = () =>
    requireAuth(() =>
      setWishlist((prev) =>
        prev.includes(product.id) ? prev.filter((i) => i !== product.id) : [...prev, product.id]
      )
    );

  const addToCart = () =>
    requireAuth(() => {
      const items = Array(qty).fill(product.id);
      setCart((prev) => [...prev, ...items]);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.ratings, 0) / reviews.length).toFixed(1)
    : null;

  const stars = (n) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < Math.round(n) ? "filled" : ""}`}>★</span>
    ));

  if (loading) return <div className="pd-loading"><div className="pd-spinner" /></div>;
  if (error)   return <div className="pd-error"><p>{error}</p><button onClick={() => navigate("/products")}>← Back</button></div>;

  const inWishlist = wishlist.includes(product.id);

  return (
    <div className="pd-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="pd-breadcrumb">
        <span onClick={() => navigate("/")}>Home</span>
        <span className="pd-bc-sep">›</span>
        <span onClick={() => navigate("/products")}>Products</span>
        <span className="pd-bc-sep">›</span>
        <span className="pd-bc-current">{product.name}</span>
      </div>

      {/* ---- Main detail card ---- */}
      <section className="pd-main">
        <div className="pd-img-wrap">
          {product.tag && <span className="pd-tag">{product.tag}</span>}
          <img src={product.image} alt={product.name} className="pd-img" />
          <button
            className={`pd-wish-btn ${inWishlist ? "active" : ""}`}
            onClick={toggleWishlist}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {inWishlist ? "♥" : "♡"}
          </button>
        </div>

        <div className="pd-info">
          <p className="pd-cat">{product.category}</p>
          <h1 className="pd-name">{product.name}</h1>

          {avgRating && (
            <div className="pd-rating-row">
              <div className="pd-stars">{stars(avgRating)}</div>
              <span className="pd-rating-val">{avgRating}</span>
              <span className="pd-review-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}

          <p className="pd-price">Rs. {product.price.toLocaleString()}</p>

          {product.description && (
            <p className="pd-desc">{product.description}</p>
          )}

          <div className="pd-actions">
            <div className="pd-qty-wrap">
              <button className="pd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="pd-qty-val">{qty}</span>
              <button className="pd-qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <button
              className={`pd-cart-btn ${added ? "added" : ""}`}
              onClick={addToCart}
            >
              {added ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
          </div>

          <button className="pd-view-cart-btn" onClick={() => navigate("/cart")}>
            View Cart →
          </button>
        </div>
      </section>

      {/* ---- Reviews ---- */}
      <section className="pd-reviews">
        <h2 className="pd-reviews-title">Customer Reviews</h2>

        {reviews.length === 0 ? (
          <p className="pd-no-reviews">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="pd-reviews-grid">
            {reviews.map((r) => (
              <div key={r.feedback_id} className="pd-review-card">
                <div className="pd-review-top">
                  <div className="pd-review-stars">{stars(r.ratings)}</div>
                  <span className="pd-review-date">
                    {new Date(r.feedback_date).toLocaleDateString("en-NP", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>
                {r.comment && <p className="pd-review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default ProductDetail;