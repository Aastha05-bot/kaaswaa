import "../Styles/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      login(data);

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "staff") navigate("/staff");
      else navigate("/home");

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="card">
        <div className="left">
          <img src="/logo.png" alt="Kaa Swaa Logo" className="logo" />
          <h1>Kaa Swaa:</h1>
          <p className="tagline">Crafted with माया.</p>
        </div>
        <div className="right">
          <h2>LOG IN</h2>
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="text">
            Don't have an account?{" "}
            <Link to="/register"><span>Sign up</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;