import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/OrderConfirm.css";

const CITIES = [
  "Pokhara",
  "Kathmandu Inside Ring Road",
  "Kathmandu Outside Ring Road",
  "Lalitpur",
  "Bhaktapur",
  "Biratnagar",
  "Butwal",
  "Bharatpur",
  "Birgunj",
  "Dharan",
  "Janakpur",
  "Nepalgunj",
  "Hetauda",
  "Itahari",
  "Damak",
];

// ── Fixed, accurate payment method icons ─────────────────
const EsewaIcon = () => (
  <img src ="https://cdn.esewa.com.np/ui/images/esewa_og.png?111" alt="eSewa" width="65" height="40" />
);

const CardIcon = () => (
  <img src="https://th.bing.com/th/id/R.cf1f4768067a1bea9a70f0ef933ec885?rik=b%2bM2lxpMcHrJJg&riu=http%3a%2f%2fclipart-library.com%2fimages_k%2fcredit-card-transparent-background%2fcredit-card-transparent-background-24.png&ehk=FtE0gCfVo5kqU8h%2b2%2fER0a7XhZrXNgCWfmfnoJdzBNs%3d&risl=&pid=ImgRaw&r=0" alt="Card" width="65" height="40" />
);

const CodIcon = () => (
  <img src="https://cdn-icons-png.flaticon.com/512/6614/6614969.png" alt="Cash on Delivery" width="65" height="40" />
);

const PAYMENT_METHODS = [
  { id: "esewa", label: "eSewa",              icon: <EsewaIcon /> },
  { id: "card",  label: "Credit / Debit Card", icon: <CardIcon />  },
  { id: "cod",   label: "Cash on Delivery",    icon: <CodIcon />   },
];

function OrderConfirm() {
  const navigate   = useNavigate();
  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const email      = sessionStorage.getItem("email");
  const fullName   = sessionStorage.getItem("full_name") || username || "";
  const userId     = sessionStorage.getItem("user_id");
  const isLoggedIn = !!token;

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [subtotal,  setSubtotal]  = useState(0);
  const [shipping,  setShipping]  = useState(150);
  const [total,     setTotal]     = useState(0);

  const [phone,         setPhone]         = useState("");
  const [city,          setCity]          = useState(CITIES[0]);
  const [address,       setAddress]       = useState("");
  const [landmark,      setLandmark]      = useState("");
  const [note,          setNote]          = useState("");
  const [paymentMethod, setPaymentMethod] = useState("esewa");
  const [placing,       setPlacing]       = useState(false);
  const [orderId,       setOrderId]       = useState(null); // track placed order
  const [errors,        setErrors]        = useState({});

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const items = JSON.parse(sessionStorage.getItem("checkout_items") || "[]");
    if (!items.length) { navigate("/cart"); return; }
    const sub = parseFloat(sessionStorage.getItem("checkout_subtotal") || 0);
    const shi = parseFloat(sessionStorage.getItem("checkout_shipping") || 150);
    setCheckoutItems(items);
    setSubtotal(sub);
    setShipping(shi);
    setTotal(sub + shi);
  }, []);

  const validate = () => {
    const e = {};
    if (!phone.trim())   e.phone   = "Phone number is required";
    if (!address.trim()) e.address = "Address is required";
    return e;
  };

  const handleProceed = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});

    if (paymentMethod === "cod") {
      placeOrder("cod");
    } else {
      // Save shipping details for payment page, then navigate
      sessionStorage.setItem("pending_order", JSON.stringify({
        phone, city, address, landmark, note,
        paymentMethod, total, subtotal, shipping,
      }));
      navigate("/payment");
    }
  };

  // ── Place order via backend ────────────────────────────
  const placeOrder = async (method) => {
    try {
      setPlacing(true);

      const items = checkoutItems.map(({ product, qty }) => ({
        product_id: product.id,
        quantity:   qty,
        price:      product.price,
      }));

      const res = await fetch("http://localhost:5000/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          user_id:        parseInt(userId),
          total_amount:   total,
          phone, city, address, landmark, note,
          payment_method: method,
          items,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place order.");
      }

      const data = await res.json();
      setOrderId(data.order_id);

      // Remove bought items from DB cart
      await fetch(`http://localhost:5000/api/cart/clear/${userId}`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      // Clean up sessionStorage checkout state
      sessionStorage.removeItem("checkout_items");
      sessionStorage.removeItem("checkout_subtotal");
      sessionStorage.removeItem("checkout_shipping");
      sessionStorage.removeItem("checkout_total");
      sessionStorage.removeItem("pending_order");

    } catch (err) {
      alert(err.message || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ── Success screen ─────────────────────────────────────
  if (orderId) {
    return (
      <div className="oc-page">
        <Header isLoggedIn={isLoggedIn} username={username} />
        <div className="oc-success">
          <div className="oc-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Order Placed!</h2>
          <p>Thank you, <strong>{fullName || username}</strong>! Your order #{orderId} has been received.</p>
          <div className="oc-success-actions">
            <button className="oc-btn-primary" onClick={() => navigate("/products")}>Continue Shopping</button>
            <button className="oc-btn-outline" onClick={() => navigate("/profile")}>View My Orders</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="oc-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <div className="oc-layout">
        {/* ── Left: Form ── */}
        <div className="oc-form-col">
          <div className="oc-header-row">
            <button className="oc-back-btn" onClick={() => navigate("/cart")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="oc-title">Checkout</h1>
          </div>

          {/* Section 1: General Information */}
          <div className="oc-section">
            <h2 className="oc-section-title">1. General Information</h2>
            <div className="oc-row-2">
              <div className="oc-field">
                <label className="oc-label">Full Name</label>
                <input className="oc-input oc-input--readonly" value={fullName} readOnly placeholder="Your full name" />
              </div>
              <div className="oc-field">
                <label className="oc-label">Email</label>
                <input className="oc-input oc-input--readonly" value={email} readOnly placeholder="Your email" />
              </div>
            </div>
            <div className="oc-field">
              <label className="oc-label">Phone Number <span className="oc-required">*</span></label>
              <input
                className={`oc-input ${errors.phone ? "oc-input--error" : ""}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="eg: 9862200000"
                type="tel"
                maxLength={15}
              />
              {errors.phone && <span className="oc-error-msg">{errors.phone}</span>}
            </div>
            <div className="oc-field">
              <label className="oc-label">Order Note <span className="oc-optional">(any message for us)</span></label>
              <input
                className="oc-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="eg: Please pack it nicely."
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="oc-section">
            <h2 className="oc-section-title">2. Delivery Address</h2>
            <div className="oc-field">
              <label className="oc-label">City / District <span className="oc-required">*</span></label>
              <div className="oc-select-wrap">
                <select className="oc-select" value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="oc-select-icon" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div className="oc-row-2">
              <div className="oc-field">
                <label className="oc-label">Address <span className="oc-required">*</span></label>
                <input
                  className={`oc-input ${errors.address ? "oc-input--error" : ""}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="eg: Pokhara-8, Pirthvi Chowk"
                />
                {errors.address && <span className="oc-error-msg">{errors.address}</span>}
              </div>
              <div className="oc-field">
                <label className="oc-label">Landmark <span className="oc-optional">(optional)</span></label>
                <input
                  className="oc-input"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="eg: Kunti Mall"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Methods */}
          <div className="oc-section">
            <h2 className="oc-section-title">3. Payment Method</h2>
            <div className="oc-payment-grid">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  className={`oc-payment-card ${paymentMethod === m.id ? "oc-payment-card--active" : ""}`}
                  onClick={() => setPaymentMethod(m.id)}
                  type="button"
                >
                  <div className="oc-payment-icon">{m.icon}</div>
                  <span className="oc-payment-label">{m.label}</span>
                  <div className={`oc-payment-check ${paymentMethod === m.id ? "oc-payment-check--active" : ""}`}>
                    {paymentMethod === m.id && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {(paymentMethod === "esewa" || paymentMethod === "card") && (
              <p className="oc-payment-note">You'll be redirected to the payment page to complete your purchase.</p>
            )}
            {paymentMethod === "cod" && (
              <p className="oc-payment-note">Pay with cash when your order arrives at your door.</p>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="oc-summary-col">
          <div className="oc-summary">
            <h2 className="oc-summary-title">Order Summary</h2>
            <div className="oc-summary-items">
              {checkoutItems.map(({ product, qty }) => (
                <div key={product.id} className="oc-summary-item">
                  <div className="oc-summary-img-wrap">
                    <img src={product.image} alt={product.name} />
                    <span className="oc-item-badge">{qty}</span>
                  </div>
                  <div className="oc-summary-item-info">
                    <p className="oc-summary-item-name">{product.name}</p>
                    <p className="oc-summary-item-price">Rs. {product.price.toLocaleString()} × {qty}</p>
                  </div>
                  <p className="oc-summary-item-total">Rs. {(product.price * qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="oc-summary-divider" />
            <div className="oc-summary-rows">
              <div className="oc-summary-row">
                <span>Sub-total</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="oc-summary-row">
                <span>Delivery Charge</span>
                <span>Rs. {shipping.toLocaleString()}</span>
              </div>
              <div className="oc-summary-row oc-summary-row--total">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
            <button className="oc-place-btn" onClick={handleProceed} disabled={placing}>
              {placing
                ? "Placing Order..."
                : paymentMethod === "cod"
                  ? "Place Order"
                  : `Pay with ${PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}`}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default OrderConfirm;
