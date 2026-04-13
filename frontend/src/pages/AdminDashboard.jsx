import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Package, Users, LogOut,
  Plus, Pencil, Trash2, Search, X, DollarSign, Clock,
  TrendingUp, ChevronDown, UserCog, Eye, FileText,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../Styles/AdminDashboard.css";

const BASE = "http://localhost:5000/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [salesData, setSalesData] = useState({ stats: {}, topProducts: [], salesByDate: [], detailedSales: [] });
  const [reportRange, setReportRange] = useState("monthly");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    product_name: "", description: "", price: "",
    category_id: "", tag: "", image_url: "",
  });

  const [staffForm, setStaffForm] = useState({
    username: "", email: "", password: "", phone_number: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchStaff();
    fetchCategories();
    fetchSalesReport(reportRange);

    const interval = setInterval(fetchOrders, 5000); // 5s polling
    return () => clearInterval(interval);
  }, []);

  const fetchCategories = () => {
    fetch(`${BASE}/categories`)
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  };

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${BASE}/products`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

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

  const fetchUsers = () => {
    fetch(`${BASE}/users`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  };

  const fetchStaff = () => {
    fetch(`${BASE}/admin/staff`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setStaffList(Array.isArray(data) ? data : []))
      .catch(() => setStaffList([]));
  };

  const fetchSalesReport = (range = "monthly") => {
    fetch(`${BASE}/admin/sales-report?range=${range}`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setSalesData(data))
      .catch(() => console.error("Sales report error"));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Stats ──────────────────────────────────────────────
  const totalRevenue = orders
    .filter(o => ["delivered", "shipped"].includes(o.order_status?.toLowerCase()))
    .reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ["pending", "confirmed", "processing", "packed"].includes(o.order_status?.toLowerCase())).length;
  const totalUsers = users.length;

  // ── Product CRUD ───────────────────────────────────────
  const openAddModal = () => {
    setEditProduct(null);
    setForm({ product_name: "", description: "", price: "", stock: 0, category_id: "", tag: "", image_url: "" });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setForm({
      product_name: p.product_name,
      description: p.description || "",
      price: p.price,
      stock: p.stock || 0,
      category_id: p.category_id || "",
      tag: p.tag || "",
      image_url: p.image_url || "",
    });
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    const method = editProduct ? "PUT" : "POST";
    const url = editProduct
      ? `${BASE}/products/${editProduct.product_id}`
      : `${BASE}/products`;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast(editProduct ? "Product updated" : "Product added");
        setShowModal(false);
        fetchProducts();
      }
    } catch { showToast("Something went wrong"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${BASE}/products/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Product deleted"); fetchProducts(); }
    } catch { showToast("Failed to delete"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("product_image", file);

    try {
      showToast("Uploading image...");
      const res = await fetch(`${BASE}/products/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ ...form, image_url: data.image_url });
        showToast("Image uploaded successfully");
      } else {
        showToast(data.message || "Failed to upload image");
      }
    } catch {
      showToast("Error uploading image");
    }
  };

  // ── Order status ───────────────────────────────────────
  const handleOrderStatus = async (order_id, status) => {
    try {
      const res = await fetch(`${BASE}/orders/${order_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ order_status: status }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id ? { ...o, order_status: status } : o
        ));
        showToast(`Order marked as ${status}`);
      }
    } catch { showToast("Failed to update order"); }
  };

  // ── Staff CRUD ─────────────────────────────────────────
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE}/admin/create-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Failed to create staff"); return; }
      showToast("Staff account created!");
      setShowStaffModal(false);
      setStaffForm({ username: "", email: "", password: "", phone_number: "" });
      fetchStaff();
    } catch { showToast("Something went wrong"); }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Delete this staff account?")) return;
    try {
      await fetch(`${BASE}/admin/staff/${id}`, {
        method: "DELETE", headers: authHeader,
      });
      showToast("Staff account deleted");
      fetchStaff();
    } catch { showToast("Failed to delete staff"); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also remove their orders and addresses.")) return;
    try {
      const res = await fetch(`${BASE}/users/admin/delete/${id}`, {
        method: "DELETE",
        headers: authHeader
      });
      if (res.ok) {
        showToast("User deleted successfully");
        fetchUsers();
      } else {
        showToast("Failed to delete user");
      }
    } catch { showToast("Something went wrong"); }
  };

  const handleLogout = () => { sessionStorage.clear(); navigate("/login"); };

  const downloadPDF = async () => {
    if (!salesData.detailedSales || salesData.detailedSales.length === 0) {
      showToast("No data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Logo (Top Left)
    try {
      const logoUrl = "/logo.png"; // Relative to public folder
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });
      if (img.complete && img.naturalHeight !== 0) {
        doc.addImage(img, 'PNG', 14, 10, 30, 15);
      }
    } catch (e) { console.error("Logo error:", e); }

    // 2. Title (Center)
    const titleRange = reportRange === "all" ? "All Time" : reportRange.charAt(0).toUpperCase() + reportRange.slice(1);
    doc.setFontSize(18);
    doc.setTextColor(59, 59, 59);
    doc.text(`${titleRange} Sales Report`, pageWidth / 2, 22, { align: "center" });

    // 3. Date (Top Right)
    doc.setFontSize(10);
    doc.setTextColor(119, 119, 119);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on: ${today}`, pageWidth - 14, 22, { align: "right" });

    // 4. Stats Summary
    doc.setDrawColor(232, 90, 138);
    doc.line(14, 30, pageWidth - 14, 30);
    doc.setFontSize(12);
    doc.setTextColor(59, 59, 59);
    doc.text(`Total Orders: ${salesData.stats?.total_orders || 0}`, 14, 40);
    doc.text(`Total Revenue: Rs. ${parseFloat(salesData.stats?.total_revenue || 0).toLocaleString()}`, pageWidth - 14, 40, { align: "right" });

    // 5. Build Table Data (with image handling)
    const tableRows = [];
    
    // Helper to get base64 from URL
    const getBase64Image = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    showToast("Generating PDF...");

    autoTable(doc, {
      startY: 48,
      head: [['Product', 'Image', 'Order ID', 'User ID', 'Total', 'Payment']],
      body: salesData.detailedSales.map(s => [
        s.product_name,
        '', // Placeholder for image
        `#${s.order_id}`,
        s.user_id,
        `Rs. ${parseFloat(s.total).toLocaleString()}`,
        s.payment_method?.toUpperCase() || 'N/A'
      ]),
      didDrawCell: async (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const s = salesData.detailedSales[data.row.index];
          if (s.image_url) {
            // We can't easily wait for async in didDrawCell without blocking
            // For production, pre-fetching images is better
            // doc.addImage(...)
          }
        }
      },
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [232, 90, 138], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 248, 249] }
    });

    doc.save(`KaaSwaa_${reportRange}_Sales_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("PDF Downloaded");
  };

  // ── Filtered lists ─────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.product_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    String(o.order_id).includes(search) ||
    String(o.user_id).includes(search) ||
    o.order_status?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStaff = staffList.filter(s =>
    s.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredTopProducts = (salesData.topProducts || []).filter(p =>
    p.product_name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredSalesByDate = (salesData.salesByDate || []).filter(d =>
    new Date(d.date).toLocaleDateString().includes(search)
  );

  const navItems = [
    { key: "overview", label: "Overview", Icon: LayoutDashboard },
    { key: "products", label: "Products", Icon: ShoppingBag },
    { key: "orders", label: "Orders", Icon: Package },
    { key: "users", label: "Users", Icon: Users },
    { key: "staff", label: "Staff", Icon: UserCog },
    { key: "sales", label: "Sales Report", Icon: FileText },
  ];

  const pageTitles = {
    overview: "Overview", products: "Products",
    orders: "Orders", users: "Users", staff: "Staff",
    sales: "Sales Report",
  };

  return (
    <div className="admin-wrapper">

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="logo-name">Kaa Swaa:</span>
          <span className="logo-label">Admin Panel</span>
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
          <LogOut size={15} strokeWidth={1.75} /> Logout
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">

        {/* Topbar */}
        <div className="admin-topbar">
          <div className="topbar-left">
            <h1 className="admin-page-title">{pageTitles[activeTab]}</h1>
          </div>
          <div className="topbar-right">
            {activeTab !== "overview" && (
              <div className="admin-search">
                <Search size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
            {activeTab === "products" && (
              <button className="btn-add" onClick={openAddModal}>
                <Plus size={15} strokeWidth={2} /> Add Product
              </button>
            )}
            {activeTab === "staff" && (
              <button className="btn-add" onClick={() => setShowStaffModal(true)}>
                <Plus size={15} strokeWidth={2} /> Add Staff
              </button>
            )}
            {activeTab === "sales" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <select 
                  className="admin-search-select"
                  value={reportRange}
                  onChange={(e) => {
                    setReportRange(e.target.value);
                    fetchSalesReport(e.target.value);
                  }}
                  style={{ 
                    padding: "8px 12px", 
                    borderRadius: "8px", 
                    border: "1px solid #ddd",
                    fontSize: "14px"
                  }}
                >
                  <option value="weekly">Last 7 Days (Weekly)</option>
                  <option value="monthly">Last 30 Days (Monthly)</option>
                  <option value="yearly">Last Year (Yearly)</option>
                  <option value="all">All Time</option>
                </select>
                <button className="btn-save" onClick={downloadPDF} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Download size={15} /> Download PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="overview-content">
            <div className="stats-grid">
              {[
                { label: "Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, Icon: DollarSign, cls: "stat-revenue" },
                { label: "Total Orders", value: totalOrders, Icon: TrendingUp, cls: "stat-orders" },
                { label: "Pending", value: pendingOrders, Icon: Clock, cls: "stat-pending" },
                { label: "Customers", value: totalUsers, Icon: Users, cls: "stat-users" },
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

        {/* ── PRODUCTS ── */}
        {activeTab === "products" && (
          <div className="table-section">
            {loading ? <p className="loading-text">Loading…</p> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Tag</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.product_id}>
                      <td><img src={p.image_url || "/placeholder.jpg"} alt={p.product_name} className="table-img" /></td>
                      <td className="td-name">{p.product_name}</td>
                      <td className="td-muted">{p.category_name || "—"}</td>
                      <td>Rs. {parseFloat(p.price).toLocaleString()}</td>
                      <td>{p.stock}</td>
                      <td>{p.tag ? <span className={`tag-pill tag-${p.tag.toLowerCase().replace(/\s+/g, "")}`}>{p.tag}</span> : <span className="td-muted">—</span>}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(p)}><Pencil size={14} /></button>
                          <button className="btn-icon btn-delete" onClick={() => handleDeleteProduct(p.product_id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && !loading && <tr><td colSpan={7} className="loading-text">No products found</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

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
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
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
                        {o.order_status || "—"}
                      </span>
                    </td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>
                      {o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <button className="btn-save" style={{ padding: "5px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }} onClick={() => fetchOrderDetails(o.order_id)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && <tr><td colSpan={9} className="loading-text">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div className="table-section">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Full Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.user_id}>
                    <td className="td-muted">{u.user_id}</td>
                    <td className="td-name">{u.full_name}</td>
                    <td className="td-muted">{u.email}</td>
                    <td className="td-muted">{u.phone || "—"}</td>
                    <td className="td-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteUser(u.user_id)} title="Delete User">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={6} className="loading-text">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── STAFF ── */}
        {activeTab === "staff" && (
          <div className="table-section">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredStaff.map(s => (
                  <tr key={s.staff_id}>
                    <td className="td-muted">{s.staff_id}</td>
                    <td className="td-name">{s.staff_name}</td>
                    <td className="td-muted">{s.email}</td>
                    <td className="td-muted">{s.phone_number || "—"}</td>
                    <td className="td-muted">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteStaff(s.staff_id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && <tr><td colSpan={6} className="loading-text">No staff found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SALES REPORT ── */}
        {activeTab === "sales" && (
          <div className="overview-content">
            <div className="stats-grid">
              <div className="stat-card stat-revenue">
                <div className="stat-icon-wrap"><DollarSign size={18} /></div>
                <div>
                  <p className="stat-label">Total Revenue (Shipped/Delivered)</p>
                  <p className="stat-value">Rs. {parseFloat(salesData.stats?.total_revenue || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="stat-card stat-orders">
                <div className="stat-icon-wrap"><TrendingUp size={18} /></div>
                <div>
                  <p className="stat-label">Total Successful Orders</p>
                  <p className="stat-value">{salesData.stats?.total_orders || 0}</p>
                </div>
              </div>
            </div>

            <div className="recent-section" style={{ marginTop: "30px" }}>
              <h3 className="section-title">Top Selling Products</h3>
              <table className="admin-table">
                <thead>
                  <tr><th>Product Name</th><th>Qty Sold</th><th>Total Revenue</th></tr>
                </thead>
                <tbody>
                  {filteredTopProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="td-name">{p.product_name}</td>
                      <td>{p.total_sold}</td>
                      <td>Rs. {parseFloat(p.total_revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredTopProducts.length === 0 && <tr><td colSpan={3} className="loading-text">No matching products</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="recent-section" style={{ marginTop: "30px" }}>
              <h3 className="section-title">Daily Sales Trend (Last 30 Days)</h3>
              <table className="admin-table">
                <thead>
                  <tr><th>Date</th><th>Revenue</th><th>Orders</th></tr>
                </thead>
                <tbody>
                  {filteredSalesByDate.map((d, idx) => (
                    <tr key={idx}>
                      <td className="td-muted">{new Date(d.date).toLocaleDateString()}</td>
                      <td>Rs. {parseFloat(d.revenue).toLocaleString()}</td>
                      <td>{d.orders}</td>
                    </tr>
                  ))}
                  {filteredSalesByDate.length === 0 && <tr><td colSpan={3} className="loading-text">No matching logs</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── PRODUCT MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct ? "Edit Product" : "New Product"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Product Name</label>
                <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Snoopy Keyring" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description…" rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="450" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tag</label>
                  <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
                    <option value="">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="New">New</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Product Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="photo-input" style={{ marginBottom: "8px" }} />
                  <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Or enter image URL here..." />
                </div>
              </div>
              {form.image_url && <div className="image-preview" style={{ marginTop: "15px", display: "flex", justifyContent: "center" }}><img src={form.image_url} alt="preview" style={{ maxHeight: "150px", borderRadius: "8px" }} /></div>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveProduct}>{editProduct ? "Save Changes" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STAFF MODAL ── */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Staff Account</h2>
              <button className="modal-close" onClick={() => setShowStaffModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input required value={staffForm.username}
                    onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                    placeholder="e.g. Ram Shrestha" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" required value={staffForm.email}
                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="ram@email.com" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" required value={staffForm.password}
                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label>Phone Number (optional)</label>
                  <input value={staffForm.phone_number}
                    onChange={e => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                    placeholder="98XXXXXXXX" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Create Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

                        {/* Customization Details for Admin */}
                        {item.customization && (() => {
                          let cust;
                          try {
                            cust = typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization;
                          } catch (e) {
                            return null;
                          }
                          return (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#555", padding: "8px", background: "#fdf2f8", borderRadius: "6px", border: "1px solid #fce4ec" }}>
                              {cust.wrapping && <p style={{ margin: "2px 0" }}><strong>Wrapping:</strong> {cust.wrapping} {cust.wrappingColor ? `(${cust.wrappingColor})` : ""}</p>}
                              {cust.giftMessage && <p style={{ margin: "2px 0" }}><strong>Message:</strong> "{cust.giftMessage}"</p>}
                              {cust.notes && <p style={{ margin: "2px 0" }}><strong>Notes:</strong> "{cust.notes}"</p>}
                              {cust.selectedFlowers && cust.selectedFlowers.length > 0 && (
                                <p style={{ margin: "2px 0" }}><strong>Add-ons:</strong> {cust.selectedFlowers.map(f => `${f.name} x${f.qty}`).join(", ")}</p>
                              )}
                              {cust.size && <p style={{ margin: "2px 0" }}><strong>Size:</strong> {cust.size}</p>}
                            </div>
                          );
                        })()}
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
