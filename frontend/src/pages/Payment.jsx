import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Payment.css";

function Payment() {
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const userId     = localStorage.getItem("user_id");
  const isLoggedIn = !!token;

  const [pendingOrder,   setPendingOrder]   = useState(null);
  const [checkoutItems,  setCheckoutItems]  = useState([]);
  const [processing,     setProcessing]     = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [orderId,        setOrderId]        = useState(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName,   setCardName]   = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");
  const [errors,     setErrors]     = useState({});

  // eSewa form state
  const [esewaPhone, setEsewaPhone] = useState("");
  const [esewaPin,   setEsewaPin]   = useState("");

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const order = JSON.parse(localStorage.getItem("pending_order") || "null");
    const items = JSON.parse(localStorage.getItem("checkout_items") || "[]");
    if (!order || !items.length) { navigate("/cart"); return; }
    setPendingOrder(order);
    setCheckoutItems(items);
  }, []);

  const isCard   = pendingOrder?.paymentMethod === "card";
  const isEsewa  = pendingOrder?.paymentMethod === "esewa";

  // ── Validation ─────────────────────────────────────────
  const validateCard = () => {
    const e = {};
    if (!cardNumber.replace(/\s/g, "") || cardNumber.replace(/\s/g, "").length < 16)
      e.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim())
      e.cardName = "Cardholder name is required";
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry))
      e.expiry = "Enter expiry as MM/YY";
    if (!cvv || cvv.length < 3)
      e.cvv = "Enter a valid CVV";
    return e;
  };

  const validateEsewa = () => {
    const e = {};
    if (!esewaPhone.trim() || esewaPhone.length < 10)
      e.esewaPhone = "Enter your eSewa phone number";
    if (!esewaPin.trim() || esewaPin.length < 4)
      e.esewaPin = "Enter your eSewa PIN";
    return e;
  };

  // ── Format card number with spaces ─────────────────────
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(val.replace(/(.{4})/g, "$1 ").trim());
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
    setExpiry(val);
  };

  // ── Submit payment ─────────────────────────────────────
  const handlePay = async () => {
    const e = isCard ? validateCard() : isEsewa ? validateEsewa() : {};
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setProcessing(true);

    try {
      // 1. Place the order first
      const items = checkoutItems.map(({ product, qty }) => ({
        product_id: product.id,
        quantity:   qty,
        price:      product.price,
      }));

      const orderRes = await fetch("http://localhost:5000/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          user_id:        parseInt(userId),
          total_amount:   pendingOrder.total,
          phone:          pendingOrder.phone,
          city:           pendingOrder.city,
          address:        pendingOrder.address,
          landmark:       pendingOrder.landmark || "",
          note:           pendingOrder.note     || "",
          payment_method: pendingOrder.paymentMethod,
          items,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Failed to place order.");
      }

      const orderData = await orderRes.json();
      const newOrderId = orderData.order_id;

      // 2. Record payment
      const payRes = await fetch("http://localhost:5000/api/payments", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          order_id:       newOrderId,
          payment_method: pendingOrder.paymentMethod === "esewa" ? "esewa" : "card",
        }),
      });

      if (!payRes.ok) throw new Error("Payment recording failed.");

      // 3. Clear cart items from DB
      const productIds = checkoutItems.map((i) => i.product.id);
      await fetch(`http://localhost:5000/api/cart/${userId}/clear`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ product_ids: productIds }),
      });

      // 4. Clean localStorage
      localStorage.removeItem("checkout_items");
      localStorage.removeItem("checkout_subtotal");
      localStorage.removeItem("checkout_shipping");
      localStorage.removeItem("checkout_total");
      localStorage.removeItem("pending_order");

      setOrderId(newOrderId);
      setSuccess(true);

    } catch (err) {
      alert(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Success screen ─────────────────────────────────────
  if (success) {
    return (
      <div className="pay-page">
        <Header isLoggedIn={isLoggedIn} username={username} />
        <div className="pay-success">
          <div className="pay-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Payment Successful!</h2>
          <p>Your order <strong>#{orderId}</strong> has been confirmed.</p>
          <div className="pay-success-actions">
            <button className="pay-btn-primary" onClick={() => navigate("/products")}>Continue Shopping</button>
            <button className="pay-btn-outline" onClick={() => navigate("/orders")}>View My Orders</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pendingOrder) return null;

  return (
    <div className="pay-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <div className="pay-layout">
        {/* ── Left: Payment Form ── */}
        <div className="pay-form-col">
          <div className="pay-header-row">
            <button className="pay-back-btn" onClick={() => navigate("/order-confirm")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="pay-title">
              {isEsewa ? "Pay with eSewa" : "Pay with Card"}
            </h1>
          </div>

          <div className="pay-section">
            {/* ── eSewa Form ── */}
            {isEsewa && (
              <>
                <div className="pay-esewa-badge">
  
                <img src ="https://cdn.esewa.com.np/ui/images/esewa_og.png?111" alt="eSewa" width="65" height="40" />

                  <span>eSewa Digital Wallet</span>
                </div>

                <div className="pay-field">
                  <label className="pay-label">eSewa Registered Phone Number <span className="pay-required">*</span></label>
                  <input
                    className={`pay-input ${errors.esewaPhone ? "pay-input--error" : ""}`}
                    value={esewaPhone}
                    onChange={(e) => setEsewaPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    type="tel"
                    maxLength={10}
                  />
                  {errors.esewaPhone && <span className="pay-error-msg">{errors.esewaPhone}</span>}
                </div>

                <div className="pay-field">
                  <label className="pay-label">eSewa PIN <span className="pay-required">*</span></label>
                  <input
                    className={`pay-input ${errors.esewaPin ? "pay-input--error" : ""}`}
                    value={esewaPin}
                    onChange={(e) => setEsewaPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    type="password"
                    maxLength={6}
                  />
                  {errors.esewaPin && <span className="pay-error-msg">{errors.esewaPin}</span>}
                </div>

                <p className="pay-note">
                  Make sure your eSewa account has sufficient balance of <strong>Rs. {pendingOrder.total?.toLocaleString()}</strong>.
                </p>
              </>
            )}

            {/* ── Card Form ── */}
            {isCard && (
              <>
                {/* Visual card preview */}
                <div className="pay-card-preview">
                  <div className="pay-card-chip">
                    <img src="https://th.bing.com/th/id/R.cf1f4768067a1bea9a70f0ef933ec885?rik=b%2bM2lxpMcHrJJg&riu=http%3a%2f%2fclipart-library.com%2fimages_k%2fcredit-card-transparent-background%2fcredit-card-transparent-background-24.png&ehk=FtE0gCfVo5kqU8h%2b2%2fER0a7XhZrXNgCWfmfnoJdzBNs%3d&risl=&pid=ImgRaw&r=0" alt="Card" width="65" height="40" />
                  </div>
                  <div className="pay-card-number">
                    {(cardNumber || "•••• •••• •••• ••••").padEnd(19, "•").slice(0, 19)}
                  </div>
                  <div className="pay-card-bottom">
                    <div>
                      <div className="pay-card-label">Card Holder</div>
                      <div className="pay-card-value">{cardName || "YOUR NAME"}</div>
                    </div>
                    <div>
                      <div className="pay-card-label">Expires</div>
                      <div className="pay-card-value">{expiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                <div className="pay-field">
                  <label className="pay-label">Card Number <span className="pay-required">*</span></label>
                  <input
                    className={`pay-input pay-input--mono ${errors.cardNumber ? "pay-input--error" : ""}`}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  {errors.cardNumber && <span className="pay-error-msg">{errors.cardNumber}</span>}
                </div>

                <div className="pay-field">
                  <label className="pay-label">Cardholder Name <span className="pay-required">*</span></label>
                  <input
                    className={`pay-input ${errors.cardName ? "pay-input--error" : ""}`}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="AS ON YOUR CARD"
                  />
                  {errors.cardName && <span className="pay-error-msg">{errors.cardName}</span>}
                </div>

                <div className="pay-row-2">
                  <div className="pay-field">
                    <label className="pay-label">Expiry Date <span className="pay-required">*</span></label>
                    <input
                      className={`pay-input pay-input--mono ${errors.expiry ? "pay-input--error" : ""}`}
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.expiry && <span className="pay-error-msg">{errors.expiry}</span>}
                  </div>
                  <div className="pay-field">
                    <label className="pay-label">CVV <span className="pay-required">*</span></label>
                    <input
                      className={`pay-input pay-input--mono ${errors.cvv ? "pay-input--error" : ""}`}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      type="password"
                      maxLength={4}
                    />
                    {errors.cvv && <span className="pay-error-msg">{errors.cvv}</span>}
                  </div>
                </div>

                <p className="pay-note">
                  🔒 Your card details are encrypted and secure.
                </p>
              </>
            )}
          </div>

          <button
            className="pay-submit-btn"
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? (
              <span className="pay-spinner-wrap"><span className="pay-btn-spinner" /> Processing...</span>
            ) : (
              `Confirm Payment — Rs. ${pendingOrder.total?.toLocaleString()}`
            )}
          </button>
        </div>

        {/* ── Right: Summary ── */}
        <div className="pay-summary-col">
          <div className="pay-summary">
            <h2 className="pay-summary-title">Order Summary</h2>

            <div className="pay-summary-items">
              {checkoutItems.map(({ product, qty }) => (
                <div key={product.id} className="pay-summary-item">
                  <div className="pay-summary-img-wrap">
                    <img src={product.image} alt={product.name} />
                    <span className="pay-item-badge">{qty}</span>
                  </div>
                  <div className="pay-summary-item-info">
                    <p className="pay-summary-item-name">{product.name}</p>
                    <p className="pay-summary-item-price">Rs. {product.price.toLocaleString()} × {qty}</p>
                  </div>
                  <p className="pay-summary-item-total">Rs. {(product.price * qty).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="pay-summary-divider" />

            <div className="pay-summary-rows">
              <div className="pay-summary-row">
                <span>Sub-total</span>
                <span>Rs. {pendingOrder.subtotal?.toLocaleString()}</span>
              </div>
              <div className="pay-summary-row">
                <span>Delivery Charge</span>
                <span>Rs. {pendingOrder.shipping?.toLocaleString()}</span>
              </div>
              <div className="pay-summary-row pay-summary-row--total">
                <span>Total</span>
                <span>Rs. {pendingOrder.total?.toLocaleString()}</span>
              </div>
            </div>

            <div className="pay-delivery-info">
              <h3>Delivering to</h3>
              <p>{pendingOrder.city}</p>
              <p>{pendingOrder.address}{pendingOrder.landmark ? `, ${pendingOrder.landmark}` : ""}</p>
              <p>{pendingOrder.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Payment;