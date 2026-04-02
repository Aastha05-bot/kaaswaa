import "../Styles/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [mode, setMode] = useState("login"); // "login" | "forgot" | "reset"
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // LOG IN HANDLER
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg(""); setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Invalid credentials"); return; }
      
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

  // FORGOT PASSWORD HANDLER
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg(""); setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to process request"); setLoading(false); return; }
      setSuccessMsg("Verification code sent to your email!");
      setMode("reset");
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD HANDLER
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg(""); setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: resetOtp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to reset password"); setLoading(false); return; }
      setSuccessMsg("Password successfully reset! You can now log in.");
      setMode("login");
      setPassword("");
      setResetOtp("");
      setNewPassword("");
    } catch (err) {
      setError("Server error. Please try again.");
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
          {error && <p className="error" style={{ marginBottom: '15px' }}>{error}</p>}
          {successMsg && <p className="success-msg" style={{ color: 'green', fontSize: '14px', marginBottom: '15px' }}>{successMsg}</p>}
          
          {/* ----- MODE: LOGIN ----- */}
          {mode === "login" && (
            <>
              <h2>LOG IN</h2>
              <form onSubmit={handleLoginSubmit}>
                <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <span 
                    className="forgot-password-link"
                    onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                  >
                    Forgot Password?
                  </span>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>
              <p className="text">
                Don't have an account? <Link to="/register"><span>Sign up</span></Link>
              </p>
            </>
          )}

          {/* ----- MODE: FORGOT PASSWORD ----- */}
          {mode === "forgot" && (
            <>
              <h2>RESET PASSWORD</h2>
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>Enter your email address and we'll send you a verification code.</p>
              <form onSubmit={handleForgotSubmit}>
                <input type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </form>
              <p className="text" style={{ marginTop: '20px', cursor: 'pointer' }} onClick={() => setMode("login")}>
                <span>← Back to Log In</span>
              </p>
            </>
          )}

          {/* ----- MODE: RESET PASSWORD ----- */}
          {mode === "reset" && (
            <>
              <h2>CREATE NEW PASSWORD</h2>
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>Enter the 6-digit code sent to {email}.</p>
              <form onSubmit={handleResetSubmit}>
                <input type="text" placeholder="6-digit Verification Code" required value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} />
                <input type="password" placeholder="New Password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
              <p className="text" style={{ marginTop: '20px', cursor: 'pointer' }} onClick={() => setMode("login")}>
                <span>← Back to Log In</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;