import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, Star, Lock, FileText, LogOut, Trash2 } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");
  const storedName = localStorage.getItem("username") || localStorage.getItem("full_name") || "User";
  const storedEmail = localStorage.getItem("email") || "";

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "orders": return <OrdersTab userId={userId} token={token} />;
      case "reviews": return <ReviewsTab userId={userId} token={token} />;
      case "personal": return <PersonalInfoTab userId={userId} token={token} initName={storedName} initEmail={storedEmail} onLogout={handleLogout} />;
      case "password": return <ChangePasswordTab userId={userId} token={token} />;
      case "terms": return <TermsTab />;
      default: return <OrdersTab userId={userId} token={token} />;
    }
  };

  return (
    <div className="profile-page">
      <Header isLoggedIn={!!token} username={storedName} />
      
      <div className="profile-container">
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {storedName.charAt(0)}
            </div>
            <h2 className="profile-name">{storedName}</h2>
            <p className="profile-email">{storedEmail}</p>
          </div>

          <nav className="profile-menu">
            <button className={`profile-menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <Package size={20} /> My Orders
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

  useEffect(() => {
    fetch(`http://localhost:5000/api/orders/orders/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, token]);

  if (loading) return <p>Loading orders...</p>;
  if (orders.length === 0) return <div className="empty-state"><h3>No orders found</h3><p>You haven't placed any orders yet.</p></div>;

  return (
    <div>
      <h2 className="tab-header">Order History</h2>
      {orders.map(o => (
        <div key={o.order_id} className="profile-list-item">
          <div className="order-info">
            <h3>Order #{o.order_id}</h3>
            <div className="order-badges">
              <span className={`badge ${o.order_status?.toLowerCase() || 'pending'}`}>{o.order_status}</span>
            </div>
            <p className="item-date">Placed on: {new Date(o.order_date).toLocaleDateString()}</p>
            
            <div className="order-items">
              <ul>
                {o.items?.map(item => (
                  <li key={item.product_id}>
                    <span>{item.quantity}x {item.product_name}</span>
                    <span>Rs. {item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
            <h4 style={{ marginTop: '10px' }}>Total: Rs. {o.total}</h4>
          </div>
        </div>
      ))}
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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch precise details from db so phone and address are populated naturally
    fetch(`http://localhost:5000/api/users/profile/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setName(data.full_name || name);
          setEmail(data.email || email);
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch(`http://localhost:5000/api/users/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ full_name: name, email, phone, address })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", text: "Profile updated successfully!" });
        localStorage.setItem("username", name);
        localStorage.setItem("email", email);
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
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9800000000" />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Kathmandu, Nepal" />
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

export default UserProfile;