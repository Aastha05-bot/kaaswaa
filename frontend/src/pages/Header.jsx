import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import "../Styles/Header.css";

function Header({ isLoggedIn, username }) {
  const navigate = useNavigate();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const dropdownRef = useRef(null);

  const { wishlist, cartItemCount } = useContext(ShopContext);

  // If props aren't passed (some pages might not), grab from local storage
  const isAuth = isLoggedIn !== undefined ? isLoggedIn : !!sessionStorage.getItem("token");
  const userDisp = username || sessionStorage.getItem("username");
  const profilePic = sessionStorage.getItem("profile_picture");

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
    sessionStorage.clear();
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

  const handleCartClick     = () => navigate(isAuth ? "/cart"     : "/login");
  const handleWishlistClick = () => navigate(isAuth ? "/wishlist" : "/login");

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
            {isAuth && (wishlist?.length || 0) > 0 && (
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
            {isAuth && (cartItemCount || 0) > 0 && (
              <span className="badge">{cartItemCount}</span>
            )}
          </button>

          {/* User icon — Redirects to Profile or Login */}
          <div className="user-menu">
            <button
              className="nav-icon-btn user-icon-btn"
              onClick={() => navigate(isAuth ? "/profile" : "/login")}
              title={isAuth ? userDisp : "Login"}
            >
              <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isAuth && profilePic ? (
                  <img 
                    src={`http://localhost:5000/uploads/profile_pics/${profilePic}`} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
            </button>
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
