import "../Styles/Footer.css";
import { Link } from "react-router-dom";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import {MdEmail, MdPhone, MdLocationPin} from "react-icons/md";

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="footer-logo" to="/home">Kaa Swaa:</Link>
          <p>Crafted with माया. Every piece tells a story.</p>
        </div>
 
        <div className="footer-links">
          <h4>Shop</h4>
          <Link to="/home">Home</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/products">Products</Link>
          <Link to="/about">About Us</Link>
        </div>
 
        <div className="footer-links">
          <h4>Follow Us</h4>
          <a href="https://www.instagram.com/kaa_swaa_/?__pwa=1" target="_blank" rel="noopener noreferrer"><FaInstagram /> Instagram</a>
          <a href="https://www.tiktok.com/@kaaswaa_np" target="_blank" rel="noopener noreferrer"><FaTiktok /> TikTok</a>
        </div>
 
        <div className="footer-links">
          <h4>Contact Us</h4>
          <a href="mailto:kaaswaa45@gmail.com"><MdEmail /> kaaswaa45@gmail.com</a>
          <a href="tel:+9779806734206"><MdPhone /> +977 9806734206</a>
          <p><MdLocationPin /> Pokhara, Nepal</p>
        </div>
      </div>
 
      <div className="footer-bottom">
        <p>© 2026 Kaa Swaa. All rights reserved.</p>
      </div>
    </footer>
  );
}
 
export default Footer;