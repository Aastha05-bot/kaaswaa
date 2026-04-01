import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/ProductDetail.css";

const BASE = "http://localhost:5000/api";

function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;
  const authHeader = { Authorization: `Bearer ${token}` };

  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cart,     setCart]     = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));

  const [product,        setProduct]        = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [inWishlist,     setInWishlist]     = useState(false);
  const [addedCart,      setAddedCart]      = useState(false);
  const [rating,         setRating]         = useState(0);
  const [hoverRating,    setHoverRating]    = useState(0);
  const [comment,        setComment]        = useState("");
  const [reviewMsg,      setReviewMsg]      = useState("");
  const [submitting,     setSubmitting]     = useState(false);

  // Persist wishlist & cart
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("cart",     JSON.stringify(cart));     }, [cart]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchRecommendations();
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (id && saved.includes(Number(id))) setInWishlist(true);
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${BASE}/products/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProduct(data);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res  = await fetch(`${BASE}/feedback/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  // ── Fetch category-based recommendations ──
  const fetchRecommendations = async () => {
    try {
      const res  = await fetch(`${BASE}/recommendations/${id}`);
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      await fetch(`${BASE}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          product_id: product.product_id,
          quantity:   1,
          price:      product.price,
        }),
      });
      setCart((prev) => [...prev, product.product_id]);
      setAddedCart(true);
      setTimeout(() => setAddedCart(false), 2000);
    } catch {
      alert("Failed to add to cart");
    }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      if (inWishlist) {
        await fetch(`${BASE}/wishlist/${product.product_id}`, {
          method: "DELETE",
          headers: authHeader,
        });
        setInWishlist(false);
        setWishlist((prev) => prev.filter((i) => i !== product.product_id));
      } else {
        await fetch(`${BASE}/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ product_id: product.product_id }),
        });
        setInWishlist(true);
        setWishlist((prev) => [...prev, product.product_id]);
      }
    } catch {
      alert("Failed to update wishlist");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!rating) { setReviewMsg("Please select a rating"); return; }

    setSubmitting(true);
    try {
      const res  = await fetch(`${BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          product_id: product.product_id,
          comment,
          ratings:    rating,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setReviewMsg(data.message); return; }
      setReviewMsg("✓ Review submitted!");
      setComment("");
      setRating(0);
      fetchReviews();
    } catch {
      setReviewMsg("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: render filled/empty stars from a numeric rating
  const renderStars = (val) => {
    const rounded = Math.round(val || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.ratings, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="pd-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />
      <div className="pd-loading"><div className="pd-spinner" /></div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="pd-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />
      <div className="pd-loading">
        <p>Product not found.</p>
        <button className="pd-back-btn" onClick={() => navigate("/products")}>← Back to Products</button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="pd-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="pd-container">

        {/* Back button */}
        <button className="pd-back-btn" onClick={() => navigate(-1)}>← Back</button>

        {/* ── Product top ── */}
        <div className="pd-top">
          <div className="pd-img-wrap">
            <img src={product.image_url || "/placeholder.jpg"} alt={product.product_name} />
            {product.tag && <span className="pd-tag">{product.tag}</span>}
          </div>

          <div className="pd-info">
            <p className="pd-category">{product.category_name || "General"}</p>
            <h1 className="pd-name">{product.product_name}</h1>

            {avgRating && (
              <div className="pd-avg-rating">
                {renderStars(avgRating)}
                <span>{avgRating} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
              </div>
            )}

            <p className="pd-price">Rs. {parseFloat(product.price).toLocaleString()}</p>
            <p className="pd-desc">{product.description || "No description available."}</p>

            <div className="pd-actions">
              <button
                className={`pd-cart-btn ${addedCart ? "added" : ""}`}
                onClick={handleAddToCart}
              >
                {addedCart ? "✓ Added to Cart!" : "Add to Cart"}
              </button>
              <button
                className={`pd-wish-btn ${inWishlist ? "active" : ""}`}
                onClick={handleWishlist}
              >
                {inWishlist ? "♥ Wishlisted" : "♡ Wishlist"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="pd-reviews">
          <h2>Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

          {/* Write review */}
          <div className="pd-review-form">
            <h3>Leave a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="pd-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`pd-star ${star <= (hoverRating || rating) ? "filled" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                placeholder="Write your review (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              {reviewMsg && <p className="pd-review-msg">{reviewMsg}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Review list */}
          <div className="pd-review-list">
            {reviews.length === 0 ? (
              <p className="pd-no-reviews">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.feedback_id} className="pd-review-card">
                  <div className="pd-review-header">
                    <span className="pd-reviewer">{r.full_name}</span>
                    <span className="pd-review-stars">
                      {"★".repeat(r.ratings)}{"☆".repeat(5 - r.ratings)}
                    </span>
                    <span className="pd-review-date">
                      {new Date(r.feedback_date).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div className="pd-reco">
            <div className="pd-reco-header">
              <h2>You Might Also Like</h2>
              <p className="pd-reco-sub">
                More from <strong>{product.category_name}</strong>
              </p>
            </div>

            <div className="pd-reco-grid">
              {recommendations.map((rec) => (
                <div
                  key={rec.product_id}
                  className="pd-reco-card"
                  onClick={() => navigate(`/products/${rec.product_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${rec.product_id}`)}
                >
                  <div className="pd-reco-img">
                    <img
                      src={rec.image_url || "/placeholder.jpg"}
                      alt={rec.product_name}
                    />
                    {rec.tag && <span className="pd-reco-tag">{rec.tag}</span>}
                  </div>

                  <div className="pd-reco-body">
                    <p className="pd-reco-cat">{rec.category_name}</p>
                    <h3 className="pd-reco-name">{rec.product_name}</h3>

                    {rec.avg_rating && (
                      <div className="pd-reco-stars">
                        {renderStars(rec.avg_rating)}
                        <span>
                          {rec.avg_rating}
                          {rec.review_count > 0 && ` (${rec.review_count})`}
                        </span>
                      </div>
                    )}

                    <p className="pd-reco-price">
                      Rs. {parseFloat(rec.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div >
      <Footer />
    </div>
  );
}

export default ProductDetail;