import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Cart.css";

function Cart() {
  const navigate = useNavigate();

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  const [wishlist,  setWishlist]  = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cart,      setCart]      = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [placing,   setPlacing]   = useState(false);
  const [ordered,   setOrdered]   = useState(false);
  const [selected,  setSelected]  = useState({}); // { [productId]: true/false }

  /* persist */
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("cart",     JSON.stringify(cart));     }, [cart]);

  /* redirect if not logged in */
  useEffect(() => { if (!isLoggedIn) navigate("/login"); }, [isLoggedIn, navigate]);

  /* fetch products */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res  = await fetch("http://localhost:5000/api/products");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(
          (Array.isArray(data) ? data : []).map((p) => ({
            id:       p.product_id,
            name:     p.product_name,
            price:    parseFloat(p.price),
            category: p.category_name || "General",
            tag:      p.tag || "",
            image:    p.image_url || "/placeholder.jpg",
          }))
        );
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  /* Build cart line items: { product, qty } */
  const cartItems = (() => {
    const counts = {};
    cart.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return Object.entries(counts).map(([id, qty]) => ({
      product: products.find((p) => p.id === Number(id)),
      qty,
    })).filter((item) => item.product);
  })();

  /* Selection helpers */
  const toggleSelect = (id) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSelectAll = () => {
    const allSelected = cartItems.every((i) => selected[i.product.id]);
    const next = {};
    cartItems.forEach((i) => { next[i.product.id] = !allSelected; });
    setSelected(next);
  };

  const selectedItems = cartItems.filter((i) => selected[i.product.id]);
  const allSelected   = cartItems.length > 0 && cartItems.every((i) => selected[i.product.id]);

  /* Totals — only selected items */
  const subtotal = selectedItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const shipping  = subtotal > 0 ? 150 : 0;
  const total     = subtotal + shipping;

  /* Qty helpers */
  const setItemQty = (id, newQty) => {
    setCart((prev) => {
      const without = prev.filter((i) => i !== id);
      const added   = Array(Math.max(0, newQty)).fill(id);
      return [...without, ...added];
    });
  };

  const removeItem = (id) => {
    setItemQty(id, 0);
    setSelected((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const moveToWishlist = (id) => {
    removeItem(id);
    setWishlist((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  /* Place order → POST /api/cart */
  const placeOrder = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to place an order.");
      return;
    }
    try {
      setPlacing(true);
      const userId = localStorage.getItem("user_id");
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, total_amount: total }),
      });
      if (!res.ok) throw new Error();
      setCart([]);
      setOrdered(true);
    } catch {
      alert("Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  /* ---- Render ---- */
  if (ordered) {
    return (
      <div className="cart-page">
        <Header wishlist={wishlist} cart={[]} isLoggedIn={isLoggedIn} username={username} />
        <div className="cart-success">
          <span className="cart-success-icon">✓</span>
          <h2>Order Placed!</h2>
          <p>Thank you, {username}! Your order has been received.</p>
          <button className="cart-continue-btn" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="cart-layout">
        {/* ---- Items column ---- */}
        <div className="cart-items-col">

          {/* Select All */}
          {!loading && cartItems.length > 0 && (
            <div className="cart-select-all">
              <label className="cart-checkbox-label">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="cart-checkbox"
                />
                <span>Select All ({cartItems.length} items)</span>
              </label>
            </div>
          )}

          {loading ? (
            <div className="cart-loading"><div className="cart-spinner" /></div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none"
                stroke="gray" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
              </svg>
              <h3>Your cart is empty</h3>
              <button className="cart-shop-btn" onClick={() => navigate("/products")}>
                Browse Products
              </button>
            </div>
          ) : (
            cartItems.map(({ product, qty }, i) => (
              <div
                className={`cart-item ${selected[product.id] ? "cart-item--selected" : ""}`}
                key={product.id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Left: image */}
                <div
                  className="cart-item-img"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img src={product.image} alt={product.name} />
                </div>

                {/* Middle: details */}
                <div className="cart-item-body">
                  <p className="cart-item-cat">{product.category}</p>
                  <h3 onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                  <p className="cart-item-unit-price">Rs. {product.price.toLocaleString()} each</p>

                  <div className="cart-item-row">
                    {/* Qty stepper */}
                    <div className="cart-qty-wrap">
                      <button className="cart-qty-btn" onClick={() => setItemQty(product.id, qty - 1)}>−</button>
                      <span className="cart-qty-val">{qty}</span>
                      <button className="cart-qty-btn" onClick={() => setItemQty(product.id, qty + 1)}>+</button>
                    </div>
                    <p className="cart-item-total">Rs. {(product.price * qty).toLocaleString()}</p>
                  </div>

                  <div className="cart-item-actions">
                    <button className="cart-action-link" onClick={() => moveToWishlist(product.id)}>
                      ♡ Save for later
                    </button>
                    <button className="cart-action-link danger" onClick={() => removeItem(product.id)}>
                      ✕ Remove
                    </button>
                  </div>
                </div>

                {/* Right: select checkbox */}
                <div className="cart-item-select">
                  <input
                    type="checkbox"
                    className="cart-checkbox"
                    checked={!!selected[product.id]}
                    onChange={() => toggleSelect(product.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---- Summary column ---- */}
        {cartItems.length > 0 && (
          <div className="cart-summary">
            <h2 className="cart-summary-title">Order Summary</h2>

            {selectedItems.length === 0 ? (
              <p className="cart-summary-empty">Select items to see total</p>
            ) : (
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal ({selectedItems.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <span>Rs. {shipping.toLocaleString()}</span>
                </div>
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              className={`cart-checkout-btn ${placing ? "loading" : ""} ${selectedItems.length === 0 ? "disabled" : ""}`}
              onClick={placeOrder}
              disabled={placing || selectedItems.length === 0}
            >
              {placing ? "Placing Order…" : `Place Order${selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}`}
            </button>

            <button className="cart-continue-link" onClick={() => navigate("/products")}>
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Cart;