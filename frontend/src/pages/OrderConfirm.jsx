import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/OrderConfirm.css";

const CITIES = [
  "Kathmandu Inside Ring Road",
  "Kathmandu Outside Ring Road",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
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

const PAYMENT_METHODS = [
  {
    id: "esewa",
    label: "eSewa",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect width="48" height="48" rx="10" fill="#60BB46"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="DM Sans, sans-serif">eSewa</text>
      </svg>
    ),
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect x="2" y="10" width="44" height="28" rx="5" fill="#e85a8a"/>
        <rect x="2" y="18" width="44" height="8" fill="#c0416c"/>
        <rect x="8" y="30" width="12" height="4" rx="2" fill="white" opacity="0.7"/>
        <rect x="26" y="30" width="14" height="4" rx="2" fill="white" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect width="48" height="48" rx="10" fill="#f5f5f5"/>
        <rect x="8" y="14" width="32" height="20" rx="4" fill="#e85a8a" opacity="0.15"/>
        <rect x="8" y="14" width="32" height="20" rx="4" stroke="#e85a8a" strokeWidth="2"/>
        <circle cx="24" cy="24" r="6" fill="#e85a8a" opacity="0.2"/>
        <circle cx="24" cy="24" r="6" stroke="#e85a8a" strokeWidth="2"/>
        <text x="24" y="28" dominantBaseline="middle" textAnchor="middle" fill="#e85a8a" fontSize="8" fontWeight="700" fontFamily="DM Sans,sans-serif">Rs</text>
      </svg>
    ),
  },
];

function OrderConfirm() {
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const email      = localStorage.getItem("email") || "";
  const fullName   = localStorage.getItem("full_name") || username || "";
  const isLoggedIn = !!token;

  const [wishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [cart]     = useState(() => JSON.parse(localStorage.getItem("cart")     || "[]"));

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [subtotal,  setSubtotal]  = useState(0);
  const [shipping,  setShipping]  = useState(150);
  const [total,     setTotal]     = useState(0);

  const [phone,          setPhone]          = useState("");
  const [city,           setCity]           = useState(CITIES[0]);
  const [address,        setAddress]        = useState("");
  const [landmark,       setLandmark]       = useState("");
  const [note,           setNote]           = useState("");
  const [paymentMethod,  setPaymentMethod]  = useState("esewa");
  const [placing,        setPlacing]        = useState(false);
  const [ordered,        setOrdered]        = useState(false);
  const [errors,         setErrors]         = useState({});

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const items = JSON.parse(localStorage.getItem("checkout_items") || "[]");
    if (!items.length) { navigate("/cart"); return; }
    const sub = parseFloat(localStorage.getItem("checkout_subtotal") || 0);
    const shi = parseFloat(localStorage.getItem("checkout_shipping") || 150);
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

    // Save order details for payment page
    localStorage.setItem("pending_order", JSON.stringify({
      phone, city, address, landmark, note,
      paymentMethod, total, subtotal, shipping,
    }));

    if (paymentMethod === "cod") {
      placeCODOrder();
    } else {
      navigate("/payment");
    }
  };

  const placeCODOrder = async () => {
    try {
      setPlacing(true);
      const userId = localStorage.getItem("user_id");
      const items = checkoutItems.map(({ product, qty }) => ({
        product_id: product.id,
        quantity:   qty,
        price:      product.price,
      }));

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id:        userId,
          total_amount:   total,
          phone, city, address, landmark, note,
          payment_method: "cod",
          items,
        }),
      });

      if (!res.ok) throw new Error();

      const selectedIds = new Set(checkoutItems.map((i) => i.product.id));
      const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
      localStorage.setItem("cart", JSON.stringify(currentCart.filter((id) => !selectedIds.has(id))));
      localStorage.removeItem("checkout_items");
      localStorage.removeItem("checkout_subtotal");
      localStorage.removeItem("checkout_shipping");
      localStorage.removeItem("checkout_total");
      localStorage.removeItem("pending_order");

      setOrdered(true);
    } catch {
      alert("Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (ordered) {
    return (
      <div className="oc-page">
        <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />
        <div className="oc-success">
          <div className="oc-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Order Placed!</h2>
          <p>Thank you, <strong>{fullName || username}</strong>! Your order has been received.</p>
          <div className="oc-success-actions">
            <button className="oc-btn-primary" onClick={() => navigate("/products")}>Continue Shopping</button>
            <button className="oc-btn-outline" onClick={() => navigate("/orders")}>View My Orders</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="oc-page">
      <Header wishlist={wishlist} cart={cart} isLoggedIn={isLoggedIn} username={username} />

      <div className="oc-layout">
        {/* ── Left: Form ── */}
        <div className="oc-form-col">
          <div className="oc-header-row">
            <button className="oc-back-btn" onClick={() => navigate("/cart")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
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
                <svg className="oc-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  placeholder="eg: Kathmandu, Tinkune"
                />
                {errors.address && <span className="oc-error-msg">{errors.address}</span>}
              </div>
              <div className="oc-field">
                <label className="oc-label">Landmark <span className="oc-optional">(optional)</span></label>
                <input
                  className="oc-input"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="eg: Madan Bhandari Park"
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
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
                  : `Pay with ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}`}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default OrderConfirm;