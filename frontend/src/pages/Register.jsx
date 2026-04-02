import "../Styles/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      navigate("/verify-otp", { state: { email } });

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
          <h2>SIGN UP</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Username" required
              value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm Password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Sign up"}
            </button>
          </form>
          <p className="text">
            Already have an account?{" "}
            <Link to="/login"><span>Log in</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;