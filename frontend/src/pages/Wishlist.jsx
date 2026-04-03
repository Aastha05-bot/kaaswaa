import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Wishlist.css";

function Wishlist() {
  const navigate = useNavigate();

  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const isLoggedIn = !!token;

  const { wishlist, loading: ctxLoading, addToCart, toggleWishlist } = useContext(ShopContext);
  const [addedId, setAddedId] = useState(null);

  /* redirect if not logged in */
  useEffect(() => { if (!isLoggedIn) navigate("/login"); }, [isLoggedIn, navigate]);

  const handleAddToCart = (id) => {
    addToCart(id, 1);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const moveToCart = (id) => {
    handleAddToCart(id);
    toggleWishlist(id);
  };

  return (
    <div className="wl-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <div className="wl-content">
        {ctxLoading ? (
          <div className="wl-empty"><div className="wl-spinner" /></div>
        ) : wishlist.length === 0 ? (
          <div className="wl-empty">
            <span className="wl-empty-icon">♡</span>
            <h3>Your wishlist is empty</h3>
            <p>Save items you love and come back to them anytime.</p>
            <button className="wl-shop-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="wl-list">
            {wishlist.map((p, i) => (
              <div
                className="wl-card"
                key={p.wishlist_id || p.product_id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Image */}
                <div className="wl-card-img" onClick={() => navigate(`/product/${p.product_id}`)}>
                  <img src={p.image_url || "/placeholder.jpg"} alt={p.product_name} />
                  {p.tag && <span className="wl-tag">{p.tag}</span>}
                </div>

                {/* Details */}
                <div className="wl-card-body">
                  <p className="wl-cat">{p.category_name || "General"}</p>
                  <h3 onClick={() => navigate(`/product/${p.product_id}`)}>{p.product_name}</h3>
                  <p className="wl-price">Rs. {Number(p.price || 0).toLocaleString()}</p>

                  <div className="wl-actions">
                    <button
                      className={`wl-cart-btn ${addedId === p.product_id ? "added" : ""}`}
                      onClick={() => handleAddToCart(p.product_id)}
                    >
                      {addedId === p.product_id ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button className="wl-move-btn" onClick={() => moveToCart(p.product_id)}>
                      Move to Cart
                    </button>
                  </div>
                </div>

                {/* Remove button on the right */}
                <button
                  className="wl-remove-btn"
                  onClick={() => toggleWishlist(p.product_id)}
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Wishlist;
