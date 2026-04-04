import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2, Edit2, Clock, CheckCircle2, ChevronDown } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/OrderConfirm.css";

const PAYMENT_METHODS = [
  { id: "cod",    label: "Cash on Delivery", icon: "https://cdn-icons-png.flaticon.com/512/6614/6614969.png" },
  { id: "khalti", label: "Pay with Khalti",  icon: "https://images.seeklogo.com/logo-png/33/1/khalti-logo-png_seeklogo-337962.png" },
];

function OrderConfirm() {
  const navigate   = useNavigate();
  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const userId     = sessionStorage.getItem("user_id");
  const isLoggedIn = !!token;

  // Checkout items & totals
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [subtotal,  setSubtotal]  = useState(0);
  const [shipping,  setShipping]  = useState(150);
  const [total,     setTotal]     = useState(0);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Payment Dropdown State
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Modal State (for adding/editing address)
  const [showModal, setShowModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [formData, setFormData] = useState({
    label: "", full_name: "", phone: "", city: "", address_details: "", is_default: false
  });

  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    
    // Fetch Items
    const items = JSON.parse(sessionStorage.getItem("checkout_items") || "[]");
    if (!items.length) { navigate("/cart"); return; }
    const sub = parseFloat(sessionStorage.getItem("checkout_subtotal") || 0);
    const shi = parseFloat(sessionStorage.getItem("checkout_shipping") || 150);
    setCheckoutItems(items);
    setSubtotal(sub);
    setShipping(shi);
    setTotal(sub + shi);

    // Fetch Addresses
    fetchAddresses();
  }, [isLoggedIn, navigate]);

  const fetchAddresses = () => {
    setLoadingAddresses(true);
    fetch(`http://localhost:5000/api/users/addresses/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setAddresses(data);
        setLoadingAddresses(false);
        // Default selection: the one marked is_default, or the first one
        const def = data.find(a => a.is_default) || data[0];
        if (def) setSelectedAddressId(def.address_id);
      })
      .catch(() => setLoadingAddresses(false));
  };

  const currentAddress = addresses.find(a => a.address_id === selectedAddressId);

  // ── Address Handlers ───────────────────────────────────
  const handleOpenModal = (addr = null) => {
    if (addr) {
      setEditingAddr(addr);
      setFormData({
        label: addr.label, full_name: addr.full_name, phone: addr.phone,
        city: addr.city, address_details: addr.address_details, is_default: !!addr.is_default
      });
    } else {
      setEditingAddr(null);
      setFormData({ label: "", full_name: "", phone: "", city: "", address_details: "", is_default: false });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const method = editingAddr ? "PUT" : "POST";
    const url = editingAddr 
      ? `http://localhost:5000/api/users/addresses/${editingAddr.address_id}`
      : "http://localhost:5000/api/users/addresses";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchAddresses();
      }
    } catch(err) { console.error(err); }
  };

  const handleSelectAddress = async (addrId) => {
    setSelectedAddressId(addrId);
    // Automatically set as default in DB
    try {
      await fetch(`http://localhost:5000/api/users/addresses/default/${addrId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // Refresh local address list to show the new 'Default' pill
      fetchAddresses();
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  const deleteAddress = async (e, addrId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this address?")) return;
    try {
      await fetch(`http://localhost:5000/api/users/addresses/${addrId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchAddresses();
    } catch(err) { console.error(err); }
  };

  // ── Place Order Handlers ────────────────────────────────
  const handlePlaceOrder = async () => {
  if (!selectedAddressId) {
    alert("Please select or add a delivery address.");
    return;
  }

  if (paymentMethod === "cod") {
    // COD flow stays the same
    placeOrder("cod", selectedAddressId);
    return;
  }

  if (paymentMethod === "khalti") {
    try {
      setPlacing(true);

      const items = checkoutItems.map(({ product, qty }) => ({
        product_id: product.id,
        quantity:   qty,
        price:      product.price,
      }));

      const res = await fetch("http://localhost:5000/api/khalti/initiate", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id:      parseInt(userId),
          total_amount: total,
          address_id:   selectedAddressId,
          address:      currentAddress.address_details,
          phone:        currentAddress.phone,
          city:         currentAddress.city,
          return_url:   "http://localhost:5173/payment-verify",
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to initiate payment.");

      // Save order_id so verify page can reference it
      sessionStorage.setItem("khalti_order_id", data.order_id);
      sessionStorage.setItem("checkout_items",   sessionStorage.getItem("checkout_items"));

      // Redirect to real Khalti payment page
      window.location.href = data.payment_url;

    } catch (err) {
      console.error(err);
      alert(`Khalti payment failed: ${err.message}`);
    } finally {
      setPlacing(false);
    }
  }
};

  const placeOrder = async (method, addrId) => {
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
          phone:          currentAddress.phone,
          city:           currentAddress.city,
          address:        currentAddress.address_details,
          address_id:     addrId,
          landmark:       "",
          note:           "",
          payment_method: method,
          items,
        }),
      });

      if (!res.ok) throw new Error("Failed to place order.");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || "Order placement failed on server.");
      }

      const data = await res.json();
      setOrderId(data.order_id);

      // Clear Cart
      await fetch(`http://localhost:5000/api/cart/clear/${userId}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      sessionStorage.removeItem("checkout_items");
      sessionStorage.removeItem("checkout_subtotal");
      sessionStorage.removeItem("checkout_shipping");

    } catch (err) {
      console.error("Order placement error:", err);
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div className="oc-page">
        <Header isLoggedIn={isLoggedIn} username={username} />
        <div className="oc-success-fullscreen">
          <div className="oc-success-box">
             <div className="success-icon-ring"><CheckCircle2 size={48} /></div>
             <h2>Your order #{orderId} is confirmed!</h2>
             <p>Thank you for shopping with Kaa Swaa. We'll start crafting your handmade treasures right away.</p>
             <div className="success-btns">
               <button onClick={() => navigate("/products")}>Continue Shopping</button>
               <button className="secondary" onClick={() => navigate("/profile")}>View Orders</button>
             </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="oc-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <main className="oc-main">
        <div className="oc-container">
          <div className="oc-left">
            <h1 className="oc-heading">Billing Details</h1>

            {/* 1. SELECT ADDRESS */}
            <section className="oc-section-modern">
              <div className="section-head">
                <h2 className="section-title">Select Address</h2>
                <button className="add-addr-btn" onClick={() => handleOpenModal()}>
                  <Plus size={16} /> Add Address
                </button>
              </div>

              {loadingAddresses ? (
                <div className="addr-loading">Loading addresses...</div>
              ) : (
                <div className="addr-grid">
                  {addresses.map(addr => {
                    const isSelected = selectedAddressId === addr.address_id;
                    return (
                      <div 
                        key={addr.address_id} 
                        className={`addr-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectAddress(addr.address_id)}
                      >
                        <div className="addr-card-top">
                          <span className="addr-label">{addr.label}</span>
                          {!!addr.is_default && <span className="default-pill">Default</span>}
                          <div className="radio-circle">
                             {isSelected && <div className="radio-inner" />}
                          </div>
                        </div>
                        <h4 className="addr-name">{addr.full_name}</h4>
                        <p className="addr-text">{addr.address_details}</p>
                        <p className="addr-text">{addr.city}</p>
                        <p className="addr-phone">Alternate No.: {addr.phone}</p>
                        <div className="addr-card-actions">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(addr); }}><Edit2 size={14} /> Edit</button>
                          <button className="del" onClick={(e) => deleteAddress(e, addr.address_id)}><Trash2 size={14} /> Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. DELIVERY */}
            <section className="oc-section-modern">
               <h2 className="section-title">Delivery</h2>
               <div className="delivery-card">
                  <Clock className="delivery-icon" size={24} />
                  <div>
                    <h4>Estimated Delivery : 5 - 6 days</h4>
                    <p>Handmade products might take extra time to craft for you.</p>
                  </div>
               </div>
            </section>

            {/* 3. PAYMENT OPTION */}
            <section className="oc-section-modern explorer-dropdown-wrap">
              <h2 className="section-title">Select Payment Option</h2>
              <div className={`oc-custom-dropdown ${dropdownOpen ? 'open' : ''}`}>
                 <div className="dropdown-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <img src={PAYMENT_METHODS.find(p => p.id === paymentMethod).icon} alt="" />
                    <span>{PAYMENT_METHODS.find(p => p.id === paymentMethod).label}</span>
                    <ChevronDown size={20} className="chevron" />
                 </div>
                 {dropdownOpen && (
                   <div className="dropdown-menu">
                     {PAYMENT_METHODS.map(m => (
                       <div 
                        key={m.id} 
                        className="dropdown-item" 
                        onClick={() => { setPaymentMethod(m.id); setDropdownOpen(false); }}
                       >
                         <img src={m.icon} alt="" />
                         {m.label}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </section>
          </div>

          <div className="oc-right">
            <div className="order-summary-card">
              <div className="summary-head">
                <h3>Order Summary</h3>
                <button className="edit-order-link" onClick={() => navigate("/cart")}>Edit your orders</button>
              </div>

              <div className="summary-items-list">
                {checkoutItems.map(item => (
                  <div key={item.product.id} className="summary-item">
                    <img src={item.product.image} alt={item.product.name} />
                    <div className="summary-item-info">
                       <p className="item-name">{item.product.name}</p>
                       <p className="item-qty">Qty: {item.qty}</p>
                    </div>
                    <span className="item-price">Rs {item.product.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="summary-totals">
                 <div className="total-row"><span>Total</span> <span>Rs {subtotal}</span></div>
                 <div className="total-row"><span>Discount</span> <span className="discount">- Rs 0</span></div>
                 <div className="total-row"><span>Delivery Charge</span> <span>Rs {shipping}</span></div>
                 <p className="tax-hint">(Inclusive of all Taxes)</p>
              </div>

              <div className="grand-total-row">
                 <p>Grand Total ({checkoutItems.length} items)</p>
                 <h3>Rs {total}</h3>
              </div>

              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? "Processing..." : "Place Order"}
              </button>

            </div>
          </div>
        </div>
      </main>

      {/* RETHINK MODAL (Add/Edit Address) */}
      {showModal && (
        <div className="oc-modal-overlay">
          <div className="oc-modal-content">
            <h3>{editingAddr ? "Edit Address" : "Add New Address"}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="oc-form-grid">
                <div className="f-group"><label>Label</label><input placeholder="eg. Home" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} required /></div>
                <div className="f-group"><label>Full Name</label><input placeholder="Receiver Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
                <div className="f-group"><label>Phone</label><input placeholder="eg. 9812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
                <div className="f-group"><label>City</label><input placeholder="eg. Pokhara" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required /></div>
                <div className="f-group full"><label>Address Details</label><input placeholder="eg. Street, Ward No." value={formData.address_details} onChange={e => setFormData({...formData, address_details: e.target.value})} required /></div>
              </div>
              <div className="oc-modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">{editingAddr ? "Save Changes" : "Add Address"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default OrderConfirm;
