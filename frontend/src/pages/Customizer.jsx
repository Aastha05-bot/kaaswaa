import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import Header from "./Header";
import Footer from "./Footer";
import { ChevronLeft, Plus, Minus, Check } from "lucide-react";
import "../Styles/Customizer.css";

const BASE = "http://localhost:5000/api";

const WRAPPING_OPTIONS = [
  { id: "none", name: "No Wrapping", price: 0, hasColors: false },
  { id: "korean", name: "Korean wrapping paper", price: 100, hasColors: true },
  { id: "kraft", name: "Kraft paper", price: 100, hasColors: false },
  { id: "butter", name: "Butter paper", price: 100, hasColors: true },
  { id: "normal", name: "Normal paper", price: 100, hasColors: true },
  { id: "transparent", name: "Transparent", price: 100, hasColors: false },
];

const COLORS = [
  { id: "pink",   hex: "#FFC0CB", name: "Pink" },
  { id: "blue",   hex: "#ADD8E6", name: "Blue" },
  { id: "black",  hex: "#000000", name: "Black" },
  { id: "white",  hex: "#FFFFFF", name: "White" },
  { id: "beige",  hex: "#F5F5DC", name: "Beige" },
  { id: "red",    hex: "#FF0000", name: "Red" },
  { id: "yellow", hex: "#FFFF00", name: "Yellow" },
  { id: "orange", hex: "#FFA500", name: "Orange" },
];

const SIZES = ["Small", "Medium", "Large", "Custom"];

function Customizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(ShopContext);

  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");
  const isLoggedIn = !!token;

  const [product, setProduct] = useState(null);
  const [allFlowers, setAllFlowers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customization State
  const [wrapping, setWrapping] = useState(WRAPPING_OPTIONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [giftMessage, setGiftMessage] = useState("");
  const [selectedFlowers, setSelectedFlowers] = useState({}); // { productId: qty }
  const [selectedSize, setSelectedSize] = useState(SIZES[1]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/products/${id}`);
      const data = await res.json();
      setProduct(data);

      // If it's a flower related product, fetch other flowers for the bouquet builder
      // Use the category name from the data
      if (data.category_name === "Flowers") {
        const flowersRes = await fetch(`${BASE}/categories`); 
        // Note: The previous categories check failed, I'll fetch ALL products and filter for Flowers
        const allRes = await fetch(`${BASE}/products`);
        const allData = await allRes.json();
        const flowerList = allData.filter(p => p.category_name === "Flowers" && p.product_id !== data.product_id);
        setAllFlowers(flowerList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlowerQty = (flowerId, delta) => {
    setSelectedFlowers(prev => {
      const current = prev[flowerId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[flowerId];
        return copy;
      }
      return { ...prev, [flowerId]: next };
    });
  };

  // Calculations
  const basePrice = parseFloat(product?.price || 0);
  const wrappingFee = wrapping.price;
  const flowersPrice = Object.entries(selectedFlowers).reduce((acc, [fId, qty]) => {
    const flower = allFlowers.find(f => f.product_id === parseInt(fId));
    return acc + (parseFloat(flower?.price || 0) * qty);
  }, 0);

  const totalPrice = basePrice + wrappingFee + flowersPrice;

  const handleAddToCartClick = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setAdding(true);
    const customization = {
      giftMessage,
      wrapping: wrapping.name,
      wrappingColor: wrapping.hasColors ? color.name : null,
      selectedFlowers: Object.entries(selectedFlowers).map(([fId, qty]) => {
        const f = allFlowers.find(fl => fl.product_id === parseInt(fId));
        return { name: f.product_name, qty, price: f.price };
      }),
      size: (product.category_name !== "Flowers") ? selectedSize : null
    };

    await addToCart(product.product_id, 1, customization, totalPrice);
    setAdding(false);
    navigate("/cart");
  };

  if (loading) return <div className="cz-loading"><div className="cz-spinner" /></div>;
  if (!product) return <div className="cz-error">Product not found.</div>;

  const isFlowerProduct = product.category_name === "Flowers";
  const isClothingProduct = ["Clothes", "Accessories", "Dolls"].includes(product.category_name);

  return (
    <div className="cz-page">
      <Header isLoggedIn={isLoggedIn} username={username} />

      <div className="cz-container">
        <button className="cz-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back to Product
        </button>

        <div className="cz-layout">
          {/* Left: Product Preview */}
          <div className="cz-preview">
            <div className="cz-img-card">
              <img src={product.image_url || "/placeholder.jpg"} alt={product.product_name} />
              <div className="cz-price-badge">Rs. {totalPrice.toLocaleString()}</div>
            </div>
            <h1 className="cz-title">{product.product_name}</h1>
            <p className="cz-desc">{product.description}</p>
          </div>

          {/* Right: Customization Options */}
          <div className="cz-options">
            <h2 className="cz-section-title">Customize Your Order</h2>

            {/* 1. Gift Message */}
            <div className="cz-section">
              <label>Gift Message (Optional)</label>
              <textarea
                placeholder="Message for your loved ones..."
                value={giftMessage}
                onChange={e => setGiftMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* 2. Wrapping Paper */}
            <div className="cz-section">
              <label>Choose Wrapping (Rs. 100)</label>
              <div className="cz-grid-options">
                {WRAPPING_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={`cz-opt-btn ${wrapping.id === opt.id ? "active" : ""}`}
                    onClick={() => setWrapping(opt)}
                  >
                    {opt.name}
                    {wrapping.id === opt.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Colors (Conditional) */}
            {wrapping.hasColors && (
              <div className="cz-section">
                <label>Select Wrapping Color</label>
                <div className="cz-colors">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      className={`cz-color-btn ${color.id === c.id ? "active" : ""}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setColor(c)}
                      title={c.name}
                    >
                      {color.id === c.id && <Check size={16} color={c.id === 'white' ? '#000' : '#fff'} />}
                    </button>
                  ))}
                </div>
                <p className="cz-selected-color">Selected: <span>{color.name}</span></p>
              </div>
            )}

            {/* 4. Bouquet Builder (Flowers Only) */}
            {isFlowerProduct && allFlowers.length > 0 && (
              <div className="cz-section">
                <label>Add Flowers to Bouquet (Add-ons)</label>
                <div className="cz-flower-list">
                  {allFlowers.map(f => (
                    <div key={f.product_id} className="cz-flower-item">
                      <img src={f.image_url || "/placeholder.jpg"} alt={f.product_name} />
                      <div className="cz-flower-info">
                        <span className="cz-flower-name">{f.product_name}</span>
                        <span className="cz-flower-price">Rs. {parseFloat(f.price).toLocaleString()}</span>
                      </div>
                      <div className="cz-flower-qty">
                        <button onClick={() => handleFlowerQty(f.product_id, -1)}><Minus size={14} /></button>
                        <span>{selectedFlowers[f.product_id] || 0}</span>
                        <button onClick={() => handleFlowerQty(f.product_id, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Size Selector (Clothing/Dolls) */}
            {isClothingProduct && (
              <div className="cz-section">
                <label>Select Size</label>
                <div className="cz-grid-options">
                  {SIZES.map(s => (
                    <button
                      key={s}
                      className={`cz-opt-btn ${selectedSize === s ? "active" : ""}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Bottom Bar for Mobile or End of List */}
            <div className="cz-footer">
              <div className="cz-total">
                <span>Total Amount:</span>
                <span className="cz-total-price">Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <button className="cz-add-btn" onClick={handleAddToCartClick} disabled={adding}>
                {adding ? "Adding..." : "Add Customized Item to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Customizer;
