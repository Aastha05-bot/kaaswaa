import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Wishlist.css";

function Wishlist() {
  const navigate = useNavigate();

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  const [wishlist,  setWishlist]  = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cart,      setCart]      = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [addedId,   setAddedId]   = useState(null);

  /* persist */
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("cart",     JSON.stringify(cart));     }, [cart]);

  /* redirect if not logged in */
  useEffect(() => { if (!isLoggedIn) navigate("/login"); }, [isLoggedIn, navigate]);

  /* fetch all products, then filter to wishlist IDs */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res  = await fetch("http://localhost:5000/api/products");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped = data.map((p) => ({
          id:       p.product_id,
          name:     p.product_name,
          price:    parseFloat(p.price),
          category: p.category_name || "General",
          tag:      p.tag || "",
          image:    p.image_url || "/placeholder.jpg",
          description: p.description || "",
        }));
        setProducts(mapped);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const wishlistItems = products.filter((p) => wishlist.includes(p.id));

  const removeFromWishlist = (id) =>
    setWishlist((prev) => prev.filter((i) => i !== id));

  const addToCart = (id) => {
    setCart((prev) => [...prev, id]);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const moveToCart = (id) => {
    addToCart(id);
    removeFromWishlist(id);
  };

  return (
    <div className="wl-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="wl-content">
        {loading ? (
          <div className="wl-empty"><div className="wl-spinner" /></div>
        ) : wishlistItems.length === 0 ? (
          <div className="wl-empty">
            <span className="wl-empty-icon">♡</span>
            <h3>Your wishlist is empty</h3>
            <p>Save items you love and come back to them anytime.</p>
            <button className="wl-shop-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="wl-grid">
            {wishlistItems.map((p, i) => (
              <div
                className="wl-card"
                key={p.id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="wl-card-img" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} alt={p.name} />
                  {p.tag && <span className="wl-tag">{p.tag}</span>}
                  <button
                    className="wl-remove-btn"
                    onClick={(e) => { e.stopPropagation(); removeFromWishlist(p.id); }}
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>
                <div className="wl-card-info">
                  <p className="wl-cat">{p.category}</p>
                  <h3 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h3>
                  <p className="wl-price">Rs. {p.price.toLocaleString()}</p>
                  <div className="wl-btns">
                    <button
                      className={`wl-cart-btn ${addedId === p.id ? "added" : ""}`}
                      onClick={() => addToCart(p.id)}
                    >
                      {addedId === p.id ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button className="wl-move-btn" onClick={() => moveToCart(p.id)}>
                      Move to Cart
                    </button>
                  </div>
                </div>
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