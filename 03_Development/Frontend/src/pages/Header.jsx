import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/Header.css";

function Header({ wishlist = [], cart = [] }) {
  const navigate = useNavigate();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const dropdownRef = useRef(null);

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleCartClick     = () => navigate(isLoggedIn ? "/cart"     : "/login");
  const handleWishlistClick = () => navigate(isLoggedIn ? "/wishlist" : "/login");

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <Link to="/home" className="nav-brand">Kaa Swaa:</Link>

        {/* Search bar */}
        <div className="search-bar-inner">
          <button type="button" className="search-icon-btn" onClick={handleSearch}>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Search for products..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="nav-actions">

          {/* Wishlist icon */}
          <button className="nav-icon-btn" title="Wishlist" onClick={handleWishlistClick}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {isLoggedIn && wishlist.length > 0 && (
              <span className="badge">{wishlist.length}</span>
            )}
          </button>

          {/* Cart icon */}
          <button className="nav-icon-btn" title="Cart" onClick={handleCartClick}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
            </svg>
            {isLoggedIn && cart.length > 0 && (
              <span className="badge">{cart.length}</span>
            )}
          </button>

          {/* User icon with dropdown */}
          <div className="user-menu" ref={dropdownRef}>
            <button
              className="nav-icon-btn user-icon-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={isLoggedIn ? username : "Login"}
            >
              <div className="user-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </button>

            {dropdownOpen && (
              <div className="user-dropdown">
                {isLoggedIn ? (
                  <>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login"    onClick={() => setDropdownOpen(false)}>Login</Link>
                    <Link to="/register" onClick={() => setDropdownOpen(false)}>Sign Up</Link>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>

      <div className="navbar-bottom">
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/categories">Categories</Link></li>
          <li><Link to="/products">Product</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Header;