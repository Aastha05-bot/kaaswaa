import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/OrderConfirm.css";

function OrderConfirm() {
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const userId     = localStorage.getItem("user_id");
  const isLoggedIn = !!token;

  const [cart,     setCart]     = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [placing,  setPlacing]  = useState(false);
  const [placed,   setPlaced]   = useState(false);
  const [orderId,  setOrderId]  = useState(null);

  useEffect(() => { if (!isLoggedIn) navigate("/login"); }, [isLoggedIn, navigate]);

  /* fetch products to resolve cart ids → names/prices */
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("http://localhost:5000/api/products");
        const data = await res.json();
        setProducts(
          (Array.isArray(data) ? data : []).map((p) => ({
            id:       p.product_id,
            name:     p.product_name,
            price:    parseFloat(p.price),
            category: p.category_name || "General",
            image:    p.image_url || "/placeholder.jpg",
          }))
        );
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  /* build line items from cart array */
  const cartItems = (() => {
    const counts = {};
    cart.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return Object.entries(counts)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
      .filter((i) => i.product);
  })();

  const subtotal = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const shipping = subtotal > 0 ? 150 : 0;
  const total    = subtotal + shipping;

  /* submit order */
  const confirmOrder = async () => {
    if (cartItems.length === 0) return;
    try {
      setPlacing(true);

      /* 1️⃣  POST to /api/orders → inserts into orders table */
      const res = await fetch("http://localhost:5000/api/orders", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id:      userId,
          total_amount: total,
          items: cartItems.map(({ product, qty }) => ({
            product_id: product.id,
            quantity:   qty,
            price:      product.price,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      /* 2️⃣  Clear cart in localStorage */
      localStorage.setItem("cart", "[]");
      setCart([]);
      setOrderId(data.order_id);
      setPlaced(true);
    } catch {
      alert("Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  /* ── Success Screen ── */
  if (placed) {
    return (
      <div className="oc-page">
        <Header wishlist={wishlist} cart={[]} isLoggedIn={isLoggedIn} username={username} />
        <div className="oc-success">
          <div className="oc-success-circle">
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="25" stroke="#10b981" strokeWidth="2" />
              <path d="M14 27l8 8 16-16" stroke="#10b981" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                className="oc-check-path" />
            </svg>
          </div>
          <h2>Order Confirmed!</h2>
          <p>Thank you, <strong>{username}</strong>! Your order has been placed successfully.</p>
          {orderId && <p className="oc-order-ref">Order ID: <strong>#{orderId}</strong></p>}
          <div className="oc-success-btns">
            <button onClick={() => navigate("/products")}>Continue Shopping</button>
            <button className="outline" onClick={() => navigate("/orders")}>View My Orders</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="oc-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="oc-container">
        <div className="oc-breadcrumb">
          <span onClick={() => navigate("/cart")} className="oc-breadcrumb-link">Cart</span>
          <span className="oc-breadcrumb-sep">›</span>
          <span className="oc-breadcrumb-active">Order Confirmation</span>
        </div>

        <h1 className="oc-title">Confirm Your Order</h1>

        {loading ? (
          <div className="oc-loading"><div className="oc-spinner" /></div>
        ) : cartItems.length === 0 ? (
          <div className="oc-empty">
            <p>Your cart is empty.</p>
            <button onClick={() => navigate("/products")}>Browse Products</button>
          </div>
        ) : (
          <div className="oc-layout">

            {/* ── Left: Items ── */}
            <div className="oc-items-col">
              <div className="oc-section-card">
                <h2 className="oc-section-title">
                  Order Items
                  <span className="oc-item-count">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
                </h2>

                <div className="oc-items-list">
                  {cartItems.map(({ product, qty }) => (
                    <div className="oc-item" key={product.id}>
                      <div className="oc-item-img">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <div className="oc-item-info">
                        <p className="oc-item-cat">{product.category}</p>
                        <p className="oc-item-name">{product.name}</p>
                        <p className="oc-item-unit">Rs. {product.price.toLocaleString()} × {qty}</p>
                      </div>
                      <div className="oc-item-subtotal">
                        Rs. {(product.price * qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="oc-section-card oc-delivery-card">
                <h2 className="oc-section-title">Delivery</h2>
                <div className="oc-delivery-row">
                  <span className="oc-delivery-icon">📦</span>
                  <div>
                    <p className="oc-delivery-label">Standard Delivery</p>
                    <p className="oc-delivery-sub">Estimated 3–5 business days</p>
                  </div>
                  <span className="oc-delivery-price">Rs. {shipping.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Right: Summary ── */}
            <div className="oc-summary-col">
              <div className="oc-summary-card">
                <h2 className="oc-section-title">Order Summary</h2>

                <div className="oc-summary-rows">
                  <div className="oc-summary-row">
                    <span>Subtotal ({cartItems.reduce((s, i) => s + i.qty, 0)} items)</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="oc-summary-row">
                    <span>Shipping</span>
                    <span>Rs. {shipping.toLocaleString()}</span>
                  </div>
                  <div className="oc-summary-row oc-summary-total">
                    <span>Total</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className={`oc-confirm-btn ${placing ? "loading" : ""}`}
                  onClick={confirmOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <><span className="oc-btn-spinner" /> Placing Order…</>
                  ) : (
                    <>✓ Confirm Order — Rs. {total.toLocaleString()}</>
                  )}
                </button>

                <button className="oc-back-btn" onClick={() => navigate("/cart")}>
                  ← Back to Cart
                </button>

                <div className="oc-trust">
                  <span>🔒 Secure checkout</span>
                  <span>📞 24/7 support</span>
                  <span>↩ Easy returns</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrderConfirm;