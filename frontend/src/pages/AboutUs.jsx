import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/About.css";
import { Heart, Target, Sparkles, CheckCircle2, Users, Star } from "lucide-react";

function About() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const uname = sessionStorage.getItem("username");
    setIsLoggedIn(!!token);
    setUsername(uname || "");
  }, []);

  return (
    <div className="about-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      {/* HERO */}
      <section className="products-hero">
        <h1 className="products-hero-title">Kaa Swaa:</h1>
        <p className="products-hero-sub">Handcrafted with love</p>
      </section>

      {/* STORY */}
      <section className="ks-section">
        <div className="ks-inner">
          <div className="ks-story">
            <div className="ks-story-text">
              <p className="ks-label">Our story</p>
              <h2>A name with<br /><em>real meaning</em></h2>
              <p>
                <strong>Kaa Swaa</strong> comes from Newari — it means <em>uneko phool</em>, a blossoming flower.
                We chose this name because we believe that good things take time. A flower doesn't rush. Neither do we.
              </p>
              <p>
                We started as three sisters who loved making things by hand. What began as a hobby slowly
                turned into something bigger — a small business we're genuinely proud of.
              </p>
              <p>
                We make everything ourselves, from scratch. If you want something customized, just ask —
                we love making pieces that feel personal. Our goal is simple: for every customer to be
                happy with what they receive.
              </p>
            </div>
            <div className="ks-story-visual">
              <div className="ks-img-frame">
                <img src="/story.jpeg" alt="The story of Kaa Swaa" />
              </div>
              <blockquote className="ks-pullquote">
                "A flower doesn't rush to bloom. We take that same approach with everything we make."
              </blockquote>
            </div>
          </div>
        </div>
      </section>
 
      {/* MISSION */}
      <section className="ks-section ks-section--tinted">
        <div className="ks-inner">
          <div className="ks-mission-wrap">
            <div>
              <p className="ks-mission-accent">What<br />we're<br />here<br />for</p>
            </div>
            <div className="ks-mission-text">
              <p className="ks-label">Our mission</p>
              <h2>We want you to trust what you buy</h2>
              <p>
                At Kaa Swaa, we want customers to feel confident ordering from us. That means being honest,
                making things properly, and actually caring about the end result — not just making a sale.
              </p>
              <ul className="ks-why-list">
                <li className="ks-why-item"><span className="ks-why-dot"></span>Everything is handmade — we don't cut corners</li>
                <li className="ks-why-item"><span className="ks-why-dot"></span>Custom orders are welcome — tell us what you have in mind</li>
                <li className="ks-why-item"><span className="ks-why-dot"></span>We reply to every message and keep you updated on your order</li>
                <li className="ks-why-item"><span className="ks-why-dot"></span>We're not happy until you are</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
 
      {/* VALUES */}
      <section className="ks-section">
        <div className="ks-inner">
          <div className="ks-section-header">
            <p className="ks-label">What we stand for</p>
            <h2>How we work</h2>
          </div>
          <div className="ks-values-grid">
 
            <div className="ks-value-card">
              <div className="ks-value-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#e85a8a" strokeWidth="1.4" />
                  <circle cx="10" cy="10" r="3.5" fill="#e85a8a" opacity="0.5" />
                </svg>
              </div>
              <h3>Handmade, always</h3>
              <p>Every product is made by hand. We don't use machines and we don't outsource. What you get is made by us, for you.</p>
            </div>
 
            <div className="ks-value-card">
              <div className="ks-value-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2.5L12.5 8H18.5L13.5 11.5L15.5 17.5L10 14L4.5 17.5L6.5 11.5L1.5 8H7.5Z" stroke="#e85a8a" strokeWidth="1.4" fill="none" />
                </svg>
              </div>
              <h3>Earning your trust</h3>
              <p>Trust is built over time. We try to earn it with every order — through good communication, honest work, and real quality.</p>
            </div>
 
            <div className="ks-value-card">
              <div className="ks-value-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 17C10 17 3 12.5 3 7.5A5 5 0 0 1 10 4.5 5 5 0 0 1 17 7.5C17 12.5 10 17 10 17Z" stroke="#e85a8a" strokeWidth="1.4" fill="none" />
                </svg>
              </div>
              <h3>Your satisfaction matters</h3>
              <p>If something isn't right, we want to know. We genuinely care about your experience, from ordering to unboxing.</p>
            </div>
 
          </div>
        </div>
      </section>
 
      {/* TEAM */}
      <section className="ks-section ks-section--tinted">
        <div className="ks-inner">
          <div className="ks-section-header">
            <p className="ks-label">The people behind the craft</p>
            <h2>Three sisters, one vision</h2>
            <p className="ks-section-sub">
              Different paths, same passion. While each of us is on our own journey,
              Kaa Swaa is something we built and grow together.
            </p>
          </div>
          <div className="ks-sisters">
 
            <div className="ks-sister-card">
              <div className="ks-avatar">A</div>
              <p className="ks-sister-name">Aastha Shrestha</p>
              <p className="ks-sister-role">Founder &amp; Designer</p>
              <p className="ks-sister-desc">
                Aastha started Kaa Swaa and leads the design side. She's the one turning ideas into
                actual products — figuring out how things should look and feel.
              </p>
              <div className="ks-study-pill">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ks-study-icon">
                  <path d="M7 1L13 4.5V5.5L7 9L1 5.5V4.5L7 1Z" stroke="#e85a8a" strokeWidth="1.1" />
                  <path d="M3.5 6.5V10C5 11.5 9 11.5 10.5 10V6.5" stroke="#e85a8a" strokeWidth="1.1" />
                </svg>
                <div>
                  <span className="ks-study-degree">BIT — Information Technology</span>
                  <span className="ks-study-college">ICP, Kathmandu</span>
                </div>
              </div>
            </div>
 
            <div className="ks-sister-card">
              <div className="ks-avatar">A</div>
              <p className="ks-sister-name">Aashree Shrestha</p>
              <p className="ks-sister-role">Co-founder &amp; Designer</p>
              <p className="ks-sister-desc">
                Aashree works alongside Aastha on the designs, helping plan and refine each piece
                before it's made. She makes sure everything looks exactly right.
              </p>
              <div className="ks-study-pill">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ks-study-icon">
                  <path d="M7 1L13 4.5V5.5L7 9L1 5.5V4.5L7 1Z" stroke="#e85a8a" strokeWidth="1.1" />
                  <path d="M3.5 6.5V10C5 11.5 9 11.5 10.5 10V6.5" stroke="#e85a8a" strokeWidth="1.1" />
                </svg>
                <div>
                  <span className="ks-study-degree">BNS — Bachelor of Nursing</span>
                  <span className="ks-study-college">Pokhara Nursing Campus</span>
                </div>
              </div>
            </div>
 
            <div className="ks-sister-card">
              <div className="ks-avatar">A</div>
              <p className="ks-sister-name">Aava Shrestha</p>
              <p className="ks-sister-role">Co-founder &amp; Operations</p>
              <p className="ks-sister-desc">
                Aava keeps everything running. She replies to customers, handles orders, and makes
                sure nothing falls through the cracks — the reason things actually get done.
              </p>
              <div className="ks-study-pill">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ks-study-icon">
                  <path d="M7 1L13 4.5V5.5L7 9L1 5.5V4.5L7 1Z" stroke="#e85a8a" strokeWidth="1.1" />
                  <path d="M3.5 6.5V10C5 11.5 9 11.5 10.5 10V6.5" stroke="#e85a8a" strokeWidth="1.1" />
                </svg>
                <div>
                  <span className="ks-study-degree">BMLT — Medical Lab Technology</span>
                  <span className="ks-study-college">Gandaki Medical College</span>
                </div>
              </div>
            </div>
 
          </div>
        </div>
      </section>
 

      <Footer />
    </div>
  );
}

export default About;
