import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import "../Styles/Product.css";
import Header from "./Header";
import Footer from "./Footer";

const categories = ["All", "Keyring", "Pots", "Dolls", "Bouquets", "Flowers", "Clothes", "Accessories", "Bracelets"];

const sortOptions = [
  { label: "Sort: Default",           value: "default"    },
  { label: "Sort: Price Low → High",  value: "price_asc"  },
  { label: "Sort: Price High → Low",  value: "price_desc" },
  { label: "Sort: Name A → Z",        value: "name_asc"   },
];

const ITEMS_PER_PAGE = 10;

function Products() {
  const navigate = useNavigate();
  const location = useLocation();

  const token      = localStorage.getItem("token");
  const username   = localStorage.getItem("username");
  const isLoggedIn = !!token;

  const search = new URLSearchParams(location.search).get("search") || "";

  const [allProducts,    setAllProducts]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");

  const { wishlist, addToCart, toggleWishlist } = useContext(ShopContext);

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy,         setSortBy]         = useState("default");
  const [addedId,        setAddedId]        = useState(null);
  const [currentPage,    setCurrentPage]    = useState(1);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res  = await fetch("http://localhost:5000/api/products");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const mapped = data.map((p) => ({
          id:          p.product_id,
          name:        p.product_name,
          price:       parseFloat(p.price),
          category:    p.category_name || "General",
          tag:         p.tag || "",
          image:       p.image_url || "/placeholder.jpg",
          description: p.description || "",
        }));
        setAllProducts(mapped);
      } catch {
        setError("Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const requireAuth = (action) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    action();
  };

  const handleToggleWishlist = (id) => requireAuth(() => toggleWishlist(id));

  const handleAddToCart = (id) =>
    requireAuth(() => {
      addToCart(id, 1);
      setAddedId(id);
      setTimeout(() => setAddedId(null), 1500);
    });

  const handleCategoryChange = (cat) => { setActiveCategory(cat); setCurrentPage(1); };
  const handleSortChange     = (val) => { setSortBy(val);         setCurrentPage(1); };

  // Filter + sort
  let filtered = allProducts.filter((p) => {
    const matchCat    = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  if (sortBy === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "name_asc")   filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx   = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated  = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className="products-page-wrapper">
      <Header isLoggedIn={isLoggedIn} username={username} />

      {/* HERO */}
      <section className="products-hero">
        <h1 className="products-hero-title">Kaa Swaa:</h1>
        <p className="products-hero-sub">Handcrafted with love</p>
      </section>

      {/* FILTERS */}
      <section className="products-controls">
        <div className="products-dropdowns">
          <div className="products-sort">
            <select value={activeCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>
          <div className="products-sort">
            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result count */}
        {!loading && !error && (
          <p className="products-result-count">
            {filtered.length === 0
              ? "No products found"
              : `Showing ${startIdx + 1}–${Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} products`
            }
            {search && <span className="products-search-tag"> for "{search}"</span>}
          </p>
        )}
      </section>

      {/* PRODUCTS GRID */}
      <section className="products-listing">
        {loading ? (
          <div className="products-empty">
            <div className="products-spinner" />
             <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="products-empty"><p>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">
            <span className="products-empty-icon">✦</span>
            <p>No products found!</p>
            {search && (
              <button
                className="products-clear-btn"
                onClick={() => navigate("/products")}
              >
                 Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid-full">
            {paginated.map((p, i) => (
              <div
                className="product-card"
                key={p.id}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="product-img">
                  <img src={p.image} alt={p.name} />
                  {p.tag && <span className="product-tag">{p.tag}</span>}
                  <button
                    className={`wishlist-btn ${wishlist.some(w => w.product_id === p.id) ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist(p.id); }}
                    title={wishlist.some(w => w.product_id === p.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wishlist.some(w => w.product_id === p.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="product-info">
                  <p className="product-category-tag">{p.category}</p>
                  <h3>{p.name}</h3>
                  <p className="product-price">Rs. {p.price.toLocaleString()}</p>
                  <button
                    className={`add-cart-btn ${addedId === p.id ? "added" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(p.id); }}
                  >
                    {addedId === p.id ? "✓ Added!" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn page-arrow"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {getPageNumbers().map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            )
          )}
          <button
            className="page-btn page-arrow"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Products;