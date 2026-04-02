import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../Styles/About.css";
import { Heart, Target, Sparkles, CheckCircle2, Users, Star } from "lucide-react";

function About() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uname = localStorage.getItem("username");
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

      {/* MAIN CONTAINER */}
      <div className="about-container">
        
        {/* STORY SECTION */}
        <section className="about-story">
          <div className="about-story-content">
            <h2>Our Story</h2>
            <p>
              The name <strong>Kaa Swaa</strong> is beautifully derived from Newari words meaning 
              <em> "uneko phool"</em> — a blossoming flower. It encapsulates the essence of creativity, patience, 
              and the mesmerizing beauty of handcrafted artistry.
            </p>
            <p>
              Kaa Swaa began as a humble hobby shared by three sisters who fell in love with the rhythmic art of crochet. 
              What started as making simple, cozy pieces for fun slowly naturally blossomed into something much more 
              meaningful, fueled by passion, patience, and a desire to create.
            </p>
            <p>
              Today, Kaa Swaa is an expanding artisan-driven business where every single product is 
              handmade from scratch with absolute love. Each piece woven reflects our collective journey — transitioning from a simple pastime 
              into a beloved brand built securely on creativity, dedication, and sisterhood.
            </p>
          </div>
          <div className="about-story-image">
            <img src="/story.jpeg" alt="The story of Kaa Swaa" />
          </div>
        </section>

        {/* MISSION & VALUES GRID */}
        <section className="about-grid">
          
          <div className="about-card">
            <div className="about-card-icon">
              <Target size={28} strokeWidth={2.5} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To preserve and promote timeless local craftsmanship by seamlessly connecting talented artisans
              with modern customers through thoughtful, aesthetic, and meaningful designs. We aim to bring a piece of handcrafted warmth into every home.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <Sparkles size={28} strokeWidth={2.5} />
            </div>
            <h3>Why Choose Us?</h3>
            <ul className="about-values-list">
              <li><CheckCircle2 size={20}/> Authentic 100% handmade products</li>
              <li><Heart size={20}/> Support and uplift local artisans</li>
              <li><Star size={20}/> Unique cultural statement designs</li>
              <li><Users size={20}/> Impeccable quality and care in every stitch</li>
            </ul>
          </div>

        </section>

      </div>

      <Footer />
    </div>
  );
}

export default About;