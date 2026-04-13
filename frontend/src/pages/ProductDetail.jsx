import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineLike, AiOutlineDislike } from "react-icons/ai";
import { ShopContext } from "../Context/ShopContext";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/ProductDetail.css";

const BASE = "http://localhost:5000/api";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");
  const isLoggedIn = !!token;
  const authHeader = { Authorization: `Bearer ${token}` };

  const { wishlist, addToCart, toggleWishlist } = useContext(ShopContext);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedCart, setAddedCart] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewMsg, setReviewMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Track per-review like/dislike counts (client-side only until backend supports it)
  const [reviewVotes, setReviewVotes] = useState({});
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchRecommendations();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/products/${id}`);
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
      const res = await fetch(`${BASE}/feedback/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${BASE}/recommendations/${id}`);
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    
    if (product.category_name?.toLowerCase() === "clothes" && !selectedSize) {
      setSizeError("Please select a size");
      return;
    }
    setSizeError("");

    const customization = { 
      notes: notes || null,
      size: selectedSize || null
    };
    addToCart(product.product_id, 1, customization);
    setAddedCart(true);
    setNotes("");
    setSelectedSize("");
    setTimeout(() => setAddedCart(false), 2000);
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    toggleWishlist(product.product_id);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!rating) { setReviewMsg("Please select a rating"); return; }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("product_id", product.product_id);
    formData.append("comment", comment);
    formData.append("ratings", rating);
    if (reviewImage) {
      formData.append("review_image", reviewImage);
    }

    try {
      const res = await fetch(`${BASE}/feedback`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setReviewMsg(data.message); return; }
      setReviewMsg("Review submitted!");
      setComment("");
      setRating(0);
      setReviewImage(null);
      fetchReviews();
    } catch {
      setReviewMsg("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = (reviewId, type) => {
    setReviewVotes((prev) => {
      const current = prev[reviewId] || { likes: 0, dislikes: 0, voted: null };
      if (current.voted === type) return prev; // already voted
      return {
        ...prev,
        [reviewId]: {
          likes: type === "like" ? current.likes + 1 : current.likes,
          dislikes: type === "dislike" ? current.dislikes + 1 : current.dislikes,
          voted: type,
        },
      };
    });
  };

  const renderStars = (val) => {
    const rounded = Math.round(val || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.ratings, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="pd-page">
      <Header isLoggedIn={isLoggedIn} username={username} />
      <div className="pd-loading"><div className="pd-spinner" /></div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="pd-page">
      <Header isLoggedIn={isLoggedIn} username={username} />
      <div className="pd-loading">
        <p>Product not found.</p>
        <button className="pd-back-btn" onClick={() => navigate("/products")}>← Back to Products</button>
      </div>
      <Footer />
    </div>
  );
  const inWishlist = wishlist?.some(w => w.product_id === product.product_id);

  return (
    <div className="pd-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <div className="pd-container">
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
            
            {product.category_name?.toLowerCase() === "clothes" && (
              <div className="pd-size-selector">
                <label>Select Size <span className="pd-required">*</span></label>
                <div className="pd-sizes">
                  {['S', 'M', 'L', 'XL'].map(s => (
                    <button 
                      key={s} 
                      className={`pd-size-btn ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => { setSelectedSize(s); setSizeError(""); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="pd-size-error">{sizeError}</p>}
              </div>
            )}

            <div className="pd-actions">
              {product.stock <= 0 ? (
                <div className="pd-out-of-stock-wrap">
                  <div className="pd-oos-buttons">
                    <span className="pd-oos-label">Out of Stock</span>
                    <button
                      className={`pd-wish-btn ${inWishlist ? "active" : ""}`}
                      onClick={handleWishlist}
                    >
                      {inWishlist ? "♥" : "♡"}
                    </button>
                  </div>
                  <p className="pd-oos-text">This item is currently unavailable. You can add it to your wishlist to save it for later!</p>
                </div>
              ) : (
                <div className="pd-buy-section">
                  {product.category_name?.toLowerCase().includes("flower") ? (
                    <div className="pd-flower-info">
                       <p className="pd-msg-tip">This product can be customized!</p>
                       <button
                         className="pd-customize-btn"
                         onClick={() => navigate(`/customize/${product.product_id}`)}
                       >
                         Customize & Build Bouquet
                       </button>
                    </div>
                  ) : (
                    <div className="pd-notes-input-wrap">
                      <label>Notes for loved ones (optional)</label>
                      <textarea 
                        placeholder="Write a message..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="pd-action-buttons">
                    <button
                      className={`pd-cart-btn ${addedCart ? "added" : ""}`}
                      onClick={handleAddToCart}
                    >
                      {addedCart ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button
                      className={`pd-wish-btn ${inWishlist ? "active" : ""}`}
                      onClick={handleWishlist}
                    >
                      {inWishlist ? "♥" : "♡ Wishlist"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Product Details Section ── */}
        <div className="pd-details-section">
          <div className="pd-details-box">
            <h2 className="pd-details-title">Product Details</h2>
            <div className="pd-details-content">
              {product.description ? (
                <ul className="pd-details-list">
                  {product.description.split('\n').filter(line => line.trim()).map((line, i) => (
                    <li key={i}>{line.trim().startsWith('•') ? line.trim().substring(1).trim() : line.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>No extra details available for this product.</p>
              )}
            </div>
          </div>
          <div className="pd-disclaimer-box">
            <div className="pd-disclaimer-header">
              <span className="pd-disclaimer-icon">⚠️</span>
              <h3>Disclaimer</h3>
            </div>
            <p className="pd-disclaimer-text">
              The contents of this website are for informational purposes only and not intended to be a substitute for professional medical advice, diagnosis, or treatment. Please seek the advice of the physician or other qualified health provider with any question you may have regarding a medical condition. Do not disregard professional medical advice or delay in seeking it because of something you have read on this website.
            </p>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="pd-reviews">
          <h2 className="pd-reviews-title">Rating &amp; Review</h2>

          {/* Summary bar */}
          {reviews.length > 0 && (() => {
            const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            reviews.forEach(r => counts[r.ratings]++);
            return (
              <div className="pd-rating-summary">
                <div className="pd-score-block">
                  <span className="pd-big-score">{avgRating}</span>
                  <span className="pd-score-star">★</span>
                  <span className="pd-score-count">{reviews.length} Rating{reviews.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="pd-bars">
                  {[5, 4, 3, 2, 1].map(n => {
                    const pct = Math.round((counts[n] / reviews.length) * 100);
                    return (
                      <div key={n} className="pd-bar-row">
                        <span className="pd-bar-label">{n}</span>
                        <span className="pd-bar-star">★</span>
                        <div className="pd-bar-track">
                          <div className={`pd-bar-fill ${n <= 2 ? "low" : ""}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="pd-bar-count">{counts[n]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Write review */}
          <div className="pd-review-form">
            <h3>Leave a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="pd-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`pd-star ${star <= (hoverRating || rating) ? "filled" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >★</span>
                ))}
              </div>
              <textarea
                placeholder="Write your review (optional)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', color: '#e85a8a', cursor: 'pointer', display: 'inline-block', padding: '6px 12px', border: '1px solid #e85a8a', borderRadius: '4px' }}>
                  {reviewImage ? "✓ Photo Added" : "Add Photo"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setReviewImage(e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />
                </label>
                {reviewImage && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>{reviewImage.name}</span>}
              </div>
              {reviewMsg && <p className="pd-review-msg">{reviewMsg}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Customer Reviews */}
          <h3 className="pd-section-title">Customer Reviews</h3>
          <div className="pd-review-list">
            {reviews.length === 0 ? (
              <p className="pd-no-reviews">No reviews yet. Be the first!</p>
            ) : (
              reviews.map(r => {
                const initials = r.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const votes = reviewVotes[r.feedback_id] || { likes: 0, dislikes: 0, voted: null };
                return (
                  <div key={r.feedback_id} className="pd-review-card">
                    <div className="pd-review-header">
                      <div className="pd-avatar">{initials}</div>
                      <div className="pd-review-meta">
                        <div className="pd-review-stars">{"★".repeat(r.ratings)}{"☆".repeat(5 - r.ratings)}</div>
                        <span className="pd-reviewer">{r.full_name}</span>
                      </div>
                      <span className="pd-review-date">
                        {new Date(r.feedback_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "2-digit" })}
                      </span>
                    </div>
                    {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                    {r.image_url && (
                      <div className="pd-review-img-wrap" style={{ marginTop: '12px' }}>
                        <img 
                          src={`http://localhost:5000${r.image_url}`} 
                          alt="Review" 
                          style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                    <div className="pd-review-actions">
                      <button
                        className={`pd-action-btn ${votes.voted === "like" ? "pd-action-btn--active" : ""}`}
                        onClick={() => handleVote(r.feedback_id, "like")}
                        title="Helpful"
                      >
                        <AiOutlineLike size={16} />
                        <span>{votes.likes}</span>
                      </button>
                      <button
                        className={`pd-action-btn ${votes.voted === "dislike" ? "pd-action-btn--active" : ""}`}
                        onClick={() => handleVote(r.feedback_id, "dislike")}
                        title="Not helpful"
                      >
                        <AiOutlineDislike size={16} />
                        <span>{votes.dislikes}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div className="pd-reco">
            <div className="pd-reco-header">
              <h2>You Might Also Like</h2>
            </div>

            <div className="pd-reco-grid">
              {recommendations.map((rec) => (
                <div
                  key={rec.product_id}
                  className="pd-reco-card"
                  onClick={() => navigate(`/product/${rec.product_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/product/${rec.product_id}`)}
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
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetail;
