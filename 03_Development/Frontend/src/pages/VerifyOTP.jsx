import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/style.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) return setError(data.message || "Verification failed");

      login(data);

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "staff") navigate("/staff");
      else navigate("/home");

    } catch {
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
          <h2>VERIFY EMAIL</h2>
          <p className="text">We sent a 6-digit code to <strong>{email}</strong></p>
          <form onSubmit={handleVerify}>
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
          <p className="text">Didn't receive it? Check your spam folder.</p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;