import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";
import "../Styles/AdminDashboard.css";

const BASE = "http://localhost:5000/api";

export default function Staff() {
  const navigate   = useNavigate();
  const staffName  = localStorage.getItem("username") || "Staff";
  const token      = localStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const [activeTab, setActiveTab] = useState("overview");
  const [orders,    setOrders]    = useState([]);
  const [search,    setSearch]    = useState("");
  const [toast,     setToast]     = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = () => {
    fetch(`${BASE}/orders`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const pendingOrders   = orders.filter(o => o.order_status === "Pending").length;
  const shippedOrders   = orders.filter(o => o.order_status === "Shipped").length;
  const deliveredOrders = orders.filter(o => o.order_status === "Delivered").length;

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

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const filteredOrders = orders.filter(o =>
    String(o.order_id).includes(search) ||
    String(o.user_id).includes(search) ||
    o.order_status?.toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { key: "overview", label: "Overview", Icon: LayoutDashboard },
    { key: "orders",   label: "Orders",   Icon: Package         },
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
              { activeTab === "overview" ? "Overview" : "Orders" }
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

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="overview-content">
            <div className="stats-grid">
              {[
                { label: "Total Orders",   value: orders.length,  Icon: Package,          cls: "stat-orders"  },
                { label: "Pending",        value: pendingOrders,  Icon: LayoutDashboard,  cls: "stat-pending" },
                { label: "Shipped",        value: shippedOrders,  Icon: Package,          cls: "stat-revenue" },
                { label: "Delivered",      value: deliveredOrders,Icon: Package,          cls: "stat-users"   },
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
                      <td className="td-name">User #{o.user_id}</td>
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

        {/* ── ORDERS ── */}
        {activeTab === "orders" && (
          <div className="table-section">
            <table className="admin-table">
              <thead>
                <tr><th>Order ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Date</th><th>Update</th></tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.order_id}>
                    <td className="td-muted">#{o.order_id}</td>
                    <td className="td-name">User #{o.user_id}</td>
                    <td>Rs. {parseFloat(o.total || 0).toLocaleString()}</td>
                    <td><span className={`status-badge status-${(o.order_status || "").toLowerCase()}`}>{o.order_status || "—"}</span></td>
                    <td className="td-muted">{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</td>
                    <td>
                      <div className="select-wrap">
                        <select className="status-select" value={o.order_status || "Pending"} onChange={e => handleOrderStatus(o.order_id, e.target.value)}>
                          <option>Pending</option>
                          <option>Shipped</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                        <ChevronDown size={12} className="select-chevron" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={6} className="loading-text">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── TOAST ── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}