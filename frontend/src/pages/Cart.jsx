import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Cart.css";

function Cart() {
  const navigate = useNavigate();

  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const isLoggedIn = !!token;

  const { cart, loading: ctxLoading, updateCartQuantity, removeFromCart, toggleWishlist } = useContext(ShopContext);

  const [selected,  setSelected]  = useState({});

  useEffect(() => { if (!isLoggedIn) navigate("/login"); }, [isLoggedIn, navigate]);

  const toggleSelect    = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleSelectAll = () => {
    const allSelected = cart.every((i) => selected[i.cart_item_id]);
    const next = {};
    cart.forEach((i) => { next[i.cart_item_id] = !allSelected; });
    setSelected(next);
  };

  const selectedItems = cart.filter((i) => selected[i.cart_item_id]);
  const allSelected   = cart.length > 0 && cart.every((i) => selected[i.cart_item_id]);

  const subtotal = selectedItems.reduce((s, item) => s + ((item.custom_price || item.price) * item.quantity), 0);
  const shipping  = subtotal > 0 ? 150 : 0;
  const total     = subtotal + shipping;

  const moveToWishlist = async (id) => {
    await removeFromCart(id);
    await toggleWishlist(id); // Handles add since it was strictly moved
  };

  const handleProceed = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }
    // Save selected items + totals for checkout page
    // Map them slightly so the checkout page gets what it expects
    const mappedForCheckout = selectedItems.map(si => ({
      product: {
        id: si.product_id,
        name: si.product_name,
        price: si.custom_price || si.price,
        image: si.image_url,
        category: si.category_name
      },
      qty: si.quantity,
      customization: si.customization ? (typeof si.customization === 'string' ? JSON.parse(si.customization) : si.customization) : null
    }));

    sessionStorage.setItem("checkout_items",    JSON.stringify(mappedForCheckout));
    sessionStorage.setItem("checkout_subtotal", subtotal);
    sessionStorage.setItem("checkout_shipping", shipping);
    sessionStorage.setItem("checkout_total",    total);
    navigate("/order-confirm");
  };

  return (
    <div className="cart-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      {ctxLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '50px 0' }}>
          <div className="cart-spinner" />
        </div>
      ) : cart.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '50px 0' }}>
          <div className="cart-empty">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none"
              stroke="gray" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9"  cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
            </svg>
            <h3>Your cart is empty</h3>
            <button className="cart-shop-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          {/* ---- Items column ---- */}
          <div className="cart-items-col">
            <div className="cart-select-all">
              <label className="cart-checkbox-label">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="cart-checkbox"
                />
                <span>Select All items</span>
              </label>
            </div>

            {cart.map((item, i) => {
              const cust = item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null;
              const unitPrice = item.custom_price || item.price;
              
              return (
              <div
                className={`cart-item ${selected[item.cart_item_id] ? "cart-item--selected" : ""}`}
                key={item.cart_item_id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="cart-item-img" onClick={() => navigate(`/product/${item.product_id}`)}>
                  <img src={item.image_url || "/placeholder.jpg"} alt={item.product_name} />
                </div>

                <div className="cart-item-body">
                  <p className="cart-item-cat">{item.category_name || "General"}</p>
                  <h3 onClick={() => navigate(`/product/${item.product_id}`)}>{item.product_name}</h3>
                  <p className="cart-item-unit-price">Rs. {Number(unitPrice).toLocaleString()} each</p>

                  {/* Rendering Customization Details */}
                  {cust && (
                    <div className="cart-item-custom-box">
                      {cust.wrapping && <p><span>Wrapping:</span> {cust.wrapping} {cust.wrappingColor ? `(${cust.wrappingColor})` : ""}</p>}
                      {cust.giftMessage && <p><span>Message:</span> "{cust.giftMessage}"</p>}
                      {cust.selectedFlowers && cust.selectedFlowers.length > 0 && (
                        <p><span>Bouquet Add-ons:</span> {cust.selectedFlowers.map(f => `${f.name} x${f.qty}`).join(", ")}</p>
                      )}
                      {cust.size && <p><span>Size:</span> {cust.size}</p>}
                    </div>
                  )}

                  <div className="cart-item-row">
                    <div className="cart-qty-wrap">
                      <button className="cart-qty-btn" onClick={() => updateCartQuantity(item.cart_item_id, item.quantity - 1)}>−</button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateCartQuantity(item.cart_item_id, item.quantity + 1)}>+</button>
                    </div>
                    <p className="cart-item-total">Rs. {(unitPrice * item.quantity).toLocaleString()}</p>
                  </div>

                  <div className="cart-item-actions">
                    <button className="cart-action-link" onClick={() => moveToWishlist(item.cart_item_id)}>
                      Save for later
                    </button>
                    <button className="cart-action-link danger" onClick={() => removeFromCart(item.cart_item_id)}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-select">
                  <input
                    type="checkbox"
                    className="cart-checkbox"
                    checked={!!selected[item.cart_item_id]}
                    onChange={() => toggleSelect(item.cart_item_id)}
                  />
                </div>
              </div>
            )})}
          </div>

          {/* ---- Summary column ---- */}
          <div className="cart-summary">
            <h2 className="cart-summary-title">Order Summary</h2>

            {selectedItems.length === 0 ? (
              <p className="cart-summary-empty">Select items to place order</p>
            ) : (
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal ({selectedItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
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
              className="cart-proceed-btn"
              onClick={handleProceed}
              disabled={selectedItems.length === 0}
            >
              Proceed to Checkout
            </button>

            <button className="cart-continue-link" onClick={() => navigate("/products")}>
              ← Continue Shopping
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Cart;
