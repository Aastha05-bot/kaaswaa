import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";

function StaffManagement() {
  const { user } = useAuth();
  const [staffList,    setStaffList]    = useState([]);
  const [staffName,    setStaffName]    = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [loading,      setLoading]      = useState(false);

  const authHeader = { Authorization: `Bearer ${user?.token}` };

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/staff", { headers: authHeader })
      .then(res => res.json())
      .then(data => setStaffList(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load staff"));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ username: staffName, email, password, phone_number: phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to create staff"); return; }

      setSuccess("Staff account created successfully!");
      setStaffName(""); setEmail(""); setPassword(""); setPhoneNumber("");

      const res = await fetch("http://localhost:5000/api/admin/staff", { headers: authHeader });
      const updated = await res.json();
      setStaffList(Array.isArray(updated) ? updated : []);

    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff account?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/staff/${id}`, {
        method: "DELETE", headers: authHeader,
      });
      setStaffList(staffList.filter(s => s.staff_id !== id));
    } catch {
      setError("Failed to delete staff");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h2>Staff Management</h2>

      <div style={{ background: "#fff0f4", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h3>Create Staff Account</h3>
        <form onSubmit={handleCreate}>
          <input type="text" placeholder="Full Name" required value={staffName}
            onChange={e => setStaffName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Email" required value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" required value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Phone Number (optional)" value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
          {error   && <p style={{ color: "red"   }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <button type="submit" disabled={loading}
            style={{ background: "#e75480", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", cursor: "pointer" }}>
            {loading ? "Creating..." : "Create Staff"}
          </button>
        </form>
      </div>

      <h3>Current Staff</h3>
      {staffList.length === 0 ? (
        <p>No staff accounts yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8c8d4" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(staff => (
              <tr key={staff.staff_id} style={{ borderBottom: "1px solid #f8c8d4" }}>
                <td style={tdStyle}>{staff.staff_name}</td>
                <td style={tdStyle}>{staff.email}</td>
                <td style={tdStyle}>{staff.phone_number || "—"}</td>
                <td style={tdStyle}>{new Date(staff.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(staff.staff_id)}
                    style={{ background: "#ff4d4d", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", padding: "10px",
  marginBottom: "12px", borderRadius: "8px",
  border: "1px solid #f8c8d4", fontSize: "14px",
};
const thStyle = { padding: "10px", textAlign: "left" };
const tdStyle = { padding: "10px" };

export default StaffManagement;
