import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, Star, Lock, FileText, LogOut, Trash2, Bell, CheckCircle, Clock, Truck, Home as HomeIcon, MapPin, MoreVertical, Plus, X, Camera } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("user_id");
  const storedName = sessionStorage.getItem("username") || sessionStorage.getItem("full_name") || "User";
  const storedEmail = sessionStorage.getItem("email") || "";
  const profilePic = sessionStorage.getItem("profile_picture");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "orders": return <OrdersTab userId={userId} token={token} />;
      case "notifications": return <NotificationsTab userId={userId} token={token} />;
      case "addresses": return <AddressesTab userId={userId} token={token} />;
      case "reviews": return <ReviewsTab userId={userId} token={token} />;
      case "personal": return <PersonalInfoTab userId={userId} token={token} initName={storedName} initEmail={storedEmail} onLogout={handleLogout} />;
      case "password": return <ChangePasswordTab userId={userId} token={token} />;
      case "terms": return <TermsTab />;
      default: return <OrdersTab userId={userId} token={token} />;
    }
  };

  const handlePhotoUploadStandalone = async (file) => {
    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const res = await fetch(`http://localhost:5000/api/users/upload-profile-pic/${userId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("profile_picture", data.filename);
        window.location.reload(); 
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (err) {
      alert("Failed to upload image");
    }
  };

  return (
    <div className="profile-page">
      <Header isLoggedIn={!!token} username={storedName} />
      
      <div className="profile-container">
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-container">
              <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                {profilePic ? (
                  <img 
                    src={`http://localhost:5000/uploads/profile_pics/${profilePic}`} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  storedName.charAt(0)
                )}
              </div>
              <label htmlFor="avatar-upload" className="avatar-edit-badge" title="Edit Profile Picture">
                <Camera size={14} />
              </label>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handlePhotoUploadStandalone(file);
                }} 
                style={{ display: 'none' }}
              />
            </div>
            <h2 className="profile-name">{storedName}</h2>
            <p className="profile-email">{storedEmail}</p>
          </div>

          <nav className="profile-menu">
            <button className={`profile-menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <Package size={20} /> My Orders
            </button>
            <button className={`profile-menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              <Bell size={20} /> Notifications
            </button>
            <button className={`profile-menu-item ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
              <MapPin size={20} /> My Addresses
            </button>
            <button className={`profile-menu-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              <Star size={20} /> My Reviews
            </button>
            <button className={`profile-menu-item ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
              <User size={20} /> Personal Information
            </button>
            <button className={`profile-menu-item ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              <Lock size={20} /> Change Password
            </button>
            <button className={`profile-menu-item ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => setActiveTab('terms')}>
              <FileText size={20} /> Terms & Conditions
            </button>
            <button className="profile-menu-item logout" onClick={handleLogout}>
              <LogOut size={20} /> Logout
            </button>
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="profile-content">
          {renderContent()}
        </main>
      </div>

      <Footer />
    </div>
  );
}

// ───── SUB COMPONENTS ─────

function OrdersTab({ userId, token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/orders/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, token]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/user/cancel/${orderId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, order_status: "Cancelled" } : o));
        setSelectedOrder(prev => ({ ...prev, order_status: "Cancelled" }));
        alert("Order cancelled successfully.");
      } else {
        alert(data.message || "Failed to cancel order.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (orders.length === 0) return <div className="empty-state"><h3>No orders found</h3><p>You haven't placed any orders yet.</p></div>;

  if (selectedOrder) {
    const status = (selectedOrder.order_status || "Pending").toLowerCase();
    const steps = [
      { id: "pending", label: "Pending", icon: Clock },
      { id: "processing", label: "Processing", icon: CheckCircle },
      { id: "shipped", label: "Shipped", icon: Truck },
      { id: "delivered", label: "Delivered", icon: HomeIcon },
    ];

    const currentIdx = steps.findIndex(s => s.id === status);

    return (
      <div className="order-details-view">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button className="profile-btn" style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setSelectedOrder(null)}>
            &larr; Back to Orders
          </button>
          {status === "pending" && (
            <button className="profile-btn btn-danger" style={{ padding: "8px 16px" }} onClick={() => handleCancelOrder(selectedOrder.order_id)}>
              Cancel Order
            </button>
          )}
        </div>
        
        <h2 className="tab-header">Order #{selectedOrder.order_id} Details</h2>

        {/* Timeline */}
        <div className="timeline-container">
          {steps.map((step, idx) => {
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx || status === "delivered";
            const StepIcon = step.icon;
            return (
              <div key={step.id} className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-dot">
                  <StepIcon size={16} />
                </div>
                <div className="step-label">{step.label}</div>
              </div>
            );
          })}
        </div>

        <div className="profile-list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="order-info">
            <div className="order-badges" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span className={`badge ${status}`}>Status: {selectedOrder.order_status}</span>
              <span className="item-date">{selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString() : ""}</span>
            </div>
            
            <div style={{ margin: "20px 0", padding: "15px", background: "#fbfbfb", borderRadius: "8px", fontSize: "14px" }}>
              <p style={{ margin: "0 0 5px" }}><strong>Shipping Address:</strong></p>
              <p style={{ margin: 0, color: "#666" }}>{selectedOrder.city}, {selectedOrder.address}</p>
              {selectedOrder.phone && <p style={{ margin: "5px 0 0", color: "#666" }}>Phone: {selectedOrder.phone}</p>}
            </div>

            <div className="order-items">
              <h4>Items Ordered:</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(selectedOrder.items || []).map((item, index) => (
                  <li key={index} className="order-product-row" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                       {item.image_url && <img src={item.image_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "5px" }} />}
                       <div>
                         <p style={{ margin: 0, fontWeight: "500" }}>{item.product_name}</p>
                         <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>Qty: {item.quantity}</p>
                       </div>
                    </div>
                    <strong>Rs. {parseFloat(item.price * item.quantity).toLocaleString()}</strong>
                  </li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "2px solid #f0f0f0", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Subtotal: Rs. {parseFloat(selectedOrder.total - 150).toLocaleString()}</p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>Shipping: Rs. 150</p>
              <h3 style={{ margin: 0, color: "#e85a8a" }}>Total Amount: Rs. {parseFloat(selectedOrder.total || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="tab-header">Order History</h2>
      {orders.map(o => (
        <div key={o.order_id} className="profile-list-item">
          <div className="order-info" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>Order #{o.order_id}</h3>
              <span className={`badge ${(o.order_status || "").toLowerCase()}`}>{o.order_status}</span>
            </div>
            <p className="item-date">{new Date(o.order_date).toLocaleDateString()}</p>
            <h4 style={{ marginTop: '10px', color: "#e85a8a" }}>Rs. {parseFloat(o.total || 0).toLocaleString()}</h4>
          </div>
          <button className="profile-btn" onClick={() => setSelectedOrder(o)}>View Order</button>
        </div>
      ))}
    </div>
  );
}

function NotificationsTab({ userId, token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/users/notifications/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setNotifications(data); setLoading(false); markAsRead(); })
      .catch(() => setLoading(false));
  }, [userId, token]);

  const markAsRead = () => {
    fetch(`http://localhost:5000/api/users/notifications/read/${userId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    }).catch(console.error);
  };

  if (loading) return <p>Loading notifications...</p>;
  if (notifications.length === 0) return <div className="empty-state"><h3>All caught up!</h3><p>You have no new notifications.</p></div>;

  return (
    <div>
      <h2 className="tab-header">Notifications</h2>
      <div className="notifications-list">
        {notifications.map(n => (
          <div key={n.notification_id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
             <div className="notification-icon">
               <Bell size={18} />
             </div>
             <div className="notification-body">
               <p className="notification-msg">{n.message}</p>
               <span className="notification-time">{new Date(n.created_at).toLocaleString()}</span>
             </div>
             {!n.is_read && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({ userId, token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    fetch(`http://localhost:5000/api/feedback/user/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [userId, token]);

  const handleDelete = async (feedbackId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/feedback/${feedbackId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchReviews();
    } catch(err) { console.error(err); }
  };

  if (loading) return <p>Loading reviews...</p>;
  if (reviews.length === 0) return <div className="empty-state"><h3>No reviews</h3><p>You haven't reviewed any products yet.</p></div>;

  return (
    <div>
      <h2 className="tab-header">My Reviews</h2>
      {reviews.map(r => (
        <div key={r.feedback_id} className="profile-list-item">
          <div className="review-info">
            <h3>{r.product_name}</h3>
            <div className="review-rating">{"★".repeat(r.ratings)}{"☆".repeat(5 - r.ratings)}</div>
            <p className="review-comment">"{r.comment}"</p>
            <p className="item-date">{new Date(r.feedback_date).toLocaleDateString()}</p>
          </div>
          <button className="profile-btn btn-danger" style={{ padding: '8px 12px', marginTop: 0 }} onClick={() => handleDelete(r.feedback_id)}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function PersonalInfoTab({ userId, token, initName, initEmail, onLogout }) {
  const [name, setName] = useState(initName);
  const [email, setEmail] = useState(initEmail);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/users/profile/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setName(data.full_name || name);
          setEmail(data.email || email);
          if (data.profile_picture) {
            sessionStorage.setItem("profile_picture", data.profile_picture);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, token]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const res = await fetch(`http://localhost:5000/api/users/upload-profile-pic/${userId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("profile_picture", data.filename);
        setStatus({ type: "success", text: "Profile picture updated!" });
        window.location.reload(); // Quick way to refresh all components
      } else {
        setStatus({ type: "error", text: data.message });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Failed to upload image" });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch(`http://localhost:5000/api/users/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ full_name: name, email })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", text: "Profile updated successfully!" });
        sessionStorage.setItem("username", name);
        sessionStorage.setItem("email", email);
      } else {
        setStatus({ type: "error", text: data.message });
      }
    } catch(err) { setStatus({ type: "error", text: "Server error" }); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        onLogout();
      } else {
        setStatus({ type: "error", text: "Failed to delete account" });
      }
    } catch(err) { setStatus({ type: "error", text: "Server error" }); }
  };

  if (loading) return <p>Loading profile information...</p>;

  return (
    <div>
      <h2 className="tab-header">Personal Information</h2>
      {status && <div className={`form-msg ${status.type}`}>{status.text}</div>}
      
      <form className="profile-form" onSubmit={handleUpdate}>
        <div className="form-group" style={{ marginBottom: '30px' }}>
          <label>Profile Picture</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="profile-avatar" style={{ width: '60px', height: '60px', overflow: 'hidden', margin: 0 }}>
              {sessionStorage.getItem("profile_picture") ? (
                <img 
                  src={`http://localhost:5000/uploads/profile_pics/${sessionStorage.getItem("profile_picture")}`} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                name.charAt(0)
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="profile-btn">Save Changes</button>
      </form>

      <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #ffebee' }}>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Once you delete your account, there is no going back. Please be certain.</p>
        <button className="profile-btn btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
      </div>
    </div>
  );
}

function ChangePasswordTab({ userId, token }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/users/change-password/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPass, new_password: newPass })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", text: "Password updated successfully!" });
        setCurrentPass(""); setNewPass("");
      } else {
        setStatus({ type: "error", text: data.message });
      }
    } catch(err) { setStatus({ type: "error", text: "Server error" }); }
  };

  return (
    <div>
      <h2 className="tab-header">Change Password</h2>
      {status && <div className={`form-msg ${status.type}`}>{status.text}</div>}
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password</label>
          <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength="6" />
        </div>
        <button type="submit" className="profile-btn">Update Password</button>
      </form>
    </div>
  );
}

function TermsTab() {
  return (
    <div>
      <h2 className="tab-header">Terms and Conditions</h2>
      <div style={{ color: '#555', lineHeight: '1.8' }}>
        <h3>1. Introduction</h3>
        <p>By using Kaa Swaa, you agree to these terms. We strive to provide the best handcrafted products securely and reliably.</p>
        
        <h3>2. Authenticity</h3>
        <p>All items on Kaa Swaa are 100% crochet handmade. Slight variations from pictures are normal and add to the charm of handmade artistry.</p>
        
        <h3>3. Orders & Returns</h3>
        <p>Once an order begins processing, it cannot be refunded. Returns are only applicable to damages occurred exclusively during initial delivery transitions.</p>
      </div>
    </div>
  );
}

function AddressesTab({ userId, token }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // track which card's menu is open
  const [editingAddr, setEditingAddr] = useState(null); // address being edited

  const [formData, setFormData] = useState({
    label: "",
    full_name: "",
    phone: "",
    city: "",
    address_details: "",
    is_default: false
  });

  const fetchAddresses = () => {
    fetch(`http://localhost:5000/api/users/addresses/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setAddresses(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [userId, token]);

  const handleOpenModal = (addr = null) => {
    if (addr) {
      setEditingAddr(addr);
      setFormData({
        label: addr.label || "",
        full_name: addr.full_name || "",
        phone: addr.phone || "",
        city: addr.city || "",
        address_details: addr.address_details || "",
        is_default: !!addr.is_default
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

  const setAsDefault = async (addrId) => {
    try {
      await fetch(`http://localhost:5000/api/users/addresses/default/${addrId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchAddresses();
    } catch(err) { console.error(err); }
  };

  const deleteAddress = async (addrId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await fetch(`http://localhost:5000/api/users/addresses/${addrId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchAddresses();
    } catch(err) { console.error(err); }
  };

  if (loading) return <p>Loading addresses...</p>;

  return (
    <div>
      <div className="address-tab-header">
        <h2 className="tab-header" style={{ border: "none", marginBottom: 0, paddingBottom: 0 }}>My Addresses</h2>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Address
        </button>
      </div>

      <div className="address-list">
        {addresses.length === 0 ? (
          <div className="empty-state"><h3>No addresses added</h3><p>Add a shipping address for a smoother checkout.</p></div>
        ) : (
          addresses.map(addr => (
            <div key={addr.address_id} className="address-card">
              <div className="address-icon-wrap">
                <MapPin size={20} />
              </div>
              <div className="address-body">
                <div className="address-top">
                  <h3 className="address-label">{addr.label}</h3>
                  {!!addr.is_default && <span className="default-badge">Default Address</span>}
                </div>
                <p className="address-details" style={{ fontWeight: 500, color: "#333" }}>{addr.full_name}</p>
                <p className="address-details">{addr.address_details}</p>
                <p className="address-details">{addr.city}</p>
                <p className="address-phone">Alternate No.: {addr.phone}</p>
              </div>
              <div className="address-actions" onClick={e => e.stopPropagation()}>
                <button className="address-menu-btn" onClick={() => setActiveMenu(activeMenu === addr.address_id ? null : addr.address_id)}>
                  <MoreVertical size={20} />
                </button>
                
                {activeMenu === addr.address_id && (
                  <div className="action-dropdown shadow-sm">
                    {!addr.is_default && (
                      <button className="dropdown-item" onClick={() => { setAsDefault(addr.address_id); setActiveMenu(null); }}>
                        <CheckCircle size={14} /> Set as Default
                      </button>
                    )}
                    <button className="dropdown-item" onClick={() => { handleOpenModal(addr); setActiveMenu(null); }}>
                      <Star size={14} /> Edit Address
                    </button>
                    <button className="dropdown-item delete" onClick={() => { deleteAddress(addr.address_id); setActiveMenu(null); }}>
                      <Trash2 size={14} /> Delete Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            <h2 className="modal-title">{editingAddr ? "Edit Address" : "Add New Address"}</h2>
            <form className="profile-form" style={{ maxWidth: "100%" }} onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Address Label (e.g. Home, Office)</label>
                <input type="text" placeholder="e.g. Sundarmarg" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Receiver's Full Name</label>
                <input type="text" placeholder="e.g. Palpasa Store" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="e.g. 9805807302" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" placeholder="e.g. Pokhara" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Address Details (Ward, Street, Landmark)</label>
                <input type="text" placeholder="e.g. Chipledhunga, Ward 17" value={formData.address_details} onChange={e => setFormData({...formData, address_details: e.target.value})} required />
              </div>
              <div className="checkbox-group" style={{ opacity: editingAddr?.is_default ? 0.5 : 1 }}>
                <input type="checkbox" checked={formData.is_default} disabled={editingAddr?.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
                <label>Set as default shipping address</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="profile-btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="profile-btn">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
