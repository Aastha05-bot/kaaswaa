import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Search,
  ChevronDown,
  Eye, X
} from "lucide-react";
import "../Styles/AdminDashboard.css";

const BASE = "http://localhost:5000/api";

export default function Staff() {
  const navigate = useNavigate();
  const staffName = sessionStorage.getItem("username") || "Staff";
  const token = sessionStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();

    const interval = setInterval(fetchOrders, 5000); // 5s polling
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = () => {
    fetch(`${BASE}/orders`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${BASE}/orders/detail/${orderId}`, { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setViewOrderDetails(data);
      } else {
        showToast("Failed to fetch order details");
      }
    } catch {
      showToast("Failed to fetch order details");
    }
  };

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${BASE}/products`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const pendingOrders = orders.filter(o => ["pending", "confirmed", "processing", "packed"].includes((o.order_status || "").toLowerCase())).length;
  const shippedOrders = orders.filter(o => (o.order_status || "").toLowerCase() === "shipped").length;
  const deliveredOrders = orders.filter(o => (o.order_status || "").toLowerCase() === "delivered").length;

  const handleOrderStatus = async (order_id, status) => {
    try {
      const res = await fetch(`${BASE}/orders/${order_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ order_status: status }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.order_id === order_id ? { ...o, order_status: status } : o));
        showToast(`Order marked as ${status}`);
      }
    } catch {
      showToast("Failed to update order");
    }
  };

  const handleStockUpdate = async (product_id, newStock) => {
    const p = products.find(prod => prod.product_id === product_id);
    if (!p) return;

    try {
      const res = await fetch(`${BASE}/products/${product_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ ...p, stock: newStock }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(item => item.product_id === product_id ? { ...item, stock: newStock } : item));
        showToast("Stock updated successfully");
      }
    } catch {
      showToast("Failed to update stock");
    }
  };

  const handleLogout = () => { sessionStorage.clear(); navigate("/login"); };

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(o.order_id || "").toLowerCase().includes(s) ||
      String(o.user_id || "").toLowerCase().includes(s) ||
      String(o.order_status || "").toLowerCase().includes(s) ||
      String(o.payment_method || "").toLowerCase().includes(s) ||
      String(o.city || "").toLowerCase().includes(s)
    );
  });

  const filteredProducts = products.filter(p =>
    (p.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { key: "overview", label: "Overview", Icon: LayoutDashboard },
    { key: "orders", label: "Orders", Icon: Package },
    { key: "inventory", label: "Inventory", Icon: Package },
  ];

  return (
    <div className="admin-wrapper">

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="logo-name">Kaa Swaa:</span>
          <span className="logo-label">Staff Panel</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`admin-nav-item ${activeTab === key ? "active" : ""}`}
              onClick={() => { setActiveTab(key); setSearch(""); }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
              {key === "orders" && pendingOrders > 0 && (
                <span className="nav-badge">{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={15} strokeWidth={1.75} />
          Logout
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">

        {/* Topbar */}
        <div className="admin-topbar">
          <div className="topbar-left">
            <h1 className="admin-page-title">
              {activeTab === "overview" ? "Overview" : activeTab === "orders" ? "Orders" : "Inventory"}
            </h1>
          </div>
          <div className="topbar-right">
            {activeTab !== "overview" && (
              <div className="admin-search">
                <Search size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Search orders"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── ORDERS ── */}
        {activeTab === "orders" && (
          <div className="table-section">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User ID</th>
                  <th>User Name</th>
                  <th>Address</th>
                  <th>Phone Number</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.order_id}>
                    <td className="td-muted">#{o.order_id}</td>
                    <td className="td-muted">{o.user_id}</td>
                    <td className="td-name">{o.user_name}</td>
                    <td className="td-muted">
                      {o.address ? `${o.address}, ${o.city}` : o.city || "—"}
                    </td>
                    <td className="td-name">{o.phone || "—"}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>Rs. {parseFloat(o.total || 0).toLocaleString()}</td>
                    <td style={{ textTransform: "capitalize", whiteSpace: 'nowrap' }}>{o.payment_method || "N/A"}</td>
                    <td>
                      <span className={`status-badge status-${(o.order_status || "").toLowerCase()}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>
                      {o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <select
                        className="status-select"
                        value={o.order_status || "Pending"}
                        onChange={(e) => handleOrderStatus(o.order_id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button className="btn-save" style={{ padding: "5px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }} onClick={() => fetchOrderDetails(o.order_id)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={10} className="loading-text">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="overview-content">
            <div className="stats-grid">
              {[
                { label: "Total Orders", value: orders.length, Icon: Package, cls: "stat-orders" },
                { label: "Pending", value: pendingOrders, Icon: LayoutDashboard, cls: "stat-pending" },
                { label: "Shipped", value: shippedOrders, Icon: Package, cls: "stat-revenue" },
                { label: "Delivered", value: deliveredOrders, Icon: Package, cls: "stat-users" },
              ].map(({ label, value, Icon, cls }) => (
                <div key={label} className={`stat-card ${cls}`}>
                  <div className="stat-icon-wrap"><Icon size={18} strokeWidth={1.75} /></div>
                  <div>
                    <p className="stat-label">{label}</p>
                    <p className="stat-value">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="recent-section">
              <h3 className="section-title">Recent Orders</h3>
              <table className="admin-table">
                <thead>
                  <tr><th>Order ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.order_id}>
                      <td className="td-muted">#{o.order_id}</td>
                      <td className="td-name">User #{o.user_id} - {o.user_name}</td>
                      <td>Rs. {parseFloat(o.total || 0).toLocaleString()}</td>
                      <td><span className={`status-badge status-${(o.order_status || "").toLowerCase()}`}>{o.order_status || "—"}</span></td>
                      <td className="td-muted">{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} className="loading-text">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === "inventory" && (
          <div className="table-section">
            {loading ? <p className="loading-text">Loading inventory...</p> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Image</th><th>Product Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.product_id}>
                      <td><img src={p.image_url || "/placeholder.jpg"} alt={p.product_name} className="table-img" /></td>
                      <td className="td-name">{p.product_name}</td>
                      <td className="td-muted">{p.category_name || "—"}</td>
                      <td>Rs. {parseFloat(p.price).toLocaleString()}</td>
                      <td>
                        <input
                          type="number"
                          className="status-select"
                          style={{ width: "80px", padding: "5px" }}
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (val !== p.stock) handleStockUpdate(p.product_id, val);
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-save"
                          style={{ padding: "5px 10px", fontSize: "12px" }}
                          onClick={(e) => {
                            const input = e.target.parentElement.parentElement.querySelector('input');
                            handleStockUpdate(p.product_id, parseInt(input.value));
                          }}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && <tr><td colSpan={6} className="loading-text">No products found</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* ── ORDER DETAILS MODAL ── */}
      {viewOrderDetails && (
        <div className="modal-overlay" onClick={() => setViewOrderDetails(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h2>Order #{viewOrderDetails.order_id} Details</h2>
              <button className="modal-close" onClick={() => setViewOrderDetails(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: "20px" }}>
                <p><strong>Status:</strong> <span className={`status-badge status-${(viewOrderDetails.order_status || "").toLowerCase()}`}>{viewOrderDetails.order_status}</span></p>
                <p><strong>Total:</strong> Rs. {parseFloat(viewOrderDetails.total || 0).toLocaleString()}</p>
                <p><strong>Date:</strong> {viewOrderDetails.order_date ? new Date(viewOrderDetails.order_date).toLocaleString() : "—"}</p>
              </div>
              <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Products</h3>
              {viewOrderDetails.items && viewOrderDetails.items.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {viewOrderDetails.items.map((item, idx) => (
                    <li key={idx} style={{ display: "flex", gap: "15px", marginBottom: "15px", padding: "10px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
                      ) : (
                        <div style={{ width: "60px", height: "60px", backgroundColor: "#e0e0e0", borderRadius: "6px" }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 5px", fontWeight: "600", color: "#333" }}>{item.product_name}</p>
                        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Qty: {item.quantity}</p>
                      </div>
                      <div style={{ fontWeight: "600", color: "#e85a8a" }}>
                        Rs. {parseFloat(item.price * item.quantity).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No products found for this order.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewOrderDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
