import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { IMAGES } from "../data/images";
import { fetchProducts, formatPrice, getMainImage } from "../lib/api";

export default function CategoryExplorer() {
  const navigate = useNavigate();
  const [activeGender, setActiveGender] = useState(null); // 'women' | 'men' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const drawerRef = useRef(null);
  const detailRef = useRef(null);
  const sectionRef = useRef(null);
  const womenPanelRef = useRef(null);
  const menPanelRef = useRef(null);

  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("black");

  // Product data for drawers (4 per gender) fetched from API
  const [womenDrawerProducts, setWomenDrawerProducts] = useState([]);
  const [menDrawerProducts, setMenDrawerProducts] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchProducts({ section: "women", limit: 4 }),
      fetchProducts({ section: "men", limit: 4 }),
    ])
      .then(([wData, mData]) => {
        if (active) {
          setWomenDrawerProducts(wData);
          setMenDrawerProducts(mData);
        }
      })
      .catch((err) => console.error("CategoryExplorer failed to load products:", err));
    return () => {
      active = false;
    };
  }, []);

  // Open gender drawer
  const openDrawer = (gender) => {
    setSelectedProduct(null);
    setActiveGender(gender);
  };

  // Close drawer
  const closeDrawer = () => {
    if (!drawerRef.current) {
      setActiveGender(null);
      return;
    }
    gsap.to(drawerRef.current, {
      y: 420,
      duration: 0.4,
      ease: "power3.inOut",
      onComplete: () => setActiveGender(null),
    });
  };

  // Open product detail panel
  const openDetail = (product) => {
    setSelectedProduct(product);
    setSelectedSize("M");
    setSelectedColor("black");
  };

  // Close product detail panel
  const closeDetail = () => {
    if (!detailRef.current) {
      setSelectedProduct(null);
      return;
    }
    gsap.to(detailRef.current, {
      x: 400,
      duration: 0.4,
      ease: "power3.inOut",
      onComplete: () => setSelectedProduct(null),
    });
  };

  // Animate drawer in
  useEffect(() => {
    if (activeGender && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { y: 420 },
        { y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [activeGender]);

  // Animate detail panel in
  useEffect(() => {
    if (selectedProduct && detailRef.current) {
      gsap.fromTo(
        detailRef.current,
        { x: 400 },
        { x: 0, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [selectedProduct]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedProduct && detailRef.current && !detailRef.current.contains(e.target)) {
        closeDetail();
        return;
      }
      if (activeGender && drawerRef.current && !drawerRef.current.contains(e.target)) {
        // Check if click is on the panels
        const wPanel = womenPanelRef.current;
        const mPanel = menPanelRef.current;
        if (wPanel && wPanel.contains(e.target)) return;
        if (mPanel && mPanel.contains(e.target)) return;
        closeDrawer();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeGender, selectedProduct]);

  const currentProducts = activeGender === "women" ? womenDrawerProducts : menDrawerProducts;

  return (
    <section
      ref={sectionRef}
      className="category-explorer"
      style={{ position: "relative", width: "100%", overflow: "hidden" }}
    >
      {/* Two side-by-side panels */}
      <div style={{ display: "flex", width: "100%" }}>
        {/* WOMEN Panel */}
        <div
          ref={womenPanelRef}
          onClick={() => openDrawer("women")}
          className="category-panel"
          style={{
            width: "50vw",
            height: "80vh",
            position: "relative",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <img
            src={IMAGES.womenSide1}
            alt="Women's Collection"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 15%",
            }}
          />
          {/* Dark gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 50%)",
            }}
          />
          <h2
            style={{
              position: "absolute",
              bottom: "32px",
              left: "32px",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "80px",
              color: "#ffffff",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              borderBottom: "0.5px solid white",
              paddingBottom: "8px",
              margin: 0,
            }}
          >
            WOMEN
          </h2>
        </div>

        {/* MEN Panel */}
        <div
          ref={menPanelRef}
          onClick={() => openDrawer("men")}
          className="category-panel"
          style={{
            width: "50vw",
            height: "80vh",
            position: "relative",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <img
            src={IMAGES.menSide1}
            alt="Men's Collection"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 15%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 50%)",
            }}
          />
          <h2
            style={{
              position: "absolute",
              bottom: "32px",
              left: "32px",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "80px",
              color: "#ffffff",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              borderBottom: "0.5px solid white",
              paddingBottom: "8px",
              margin: 0,
            }}
          >
            MEN
          </h2>
        </div>
      </div>

      {/* Product Drawer */}
      {activeGender && (
        <div
          ref={drawerRef}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "420px",
            background: "#ffffff",
            borderTop: "0.5px solid #000",
            zIndex: 30,
            transform: "translateY(420px)",
          }}
        >
          {/* Close button */}
          <button
            onClick={closeDrawer}
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#000",
              zIndex: 5,
            }}
          >
            ✕
          </button>

          {/* Section label */}
          <div style={{ padding: "20px 24px 0" }}>
            <span
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#666",
              }}
            >
              {activeGender === "women" ? "WOMEN'S" : "MEN'S"} COLLECTION
            </span>
          </div>

          {/* Horizontal scrollable product row */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              padding: "20px 24px",
              overflowX: "auto",
              overflowY: "hidden",
              height: "calc(100% - 60px)",
            }}
            className="no-scrollbar"
          >
            {currentProducts.map((product) => (
              <div
                key={product.id || product.slug}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.slug || product.id}`, { state: { product } });
                }}
                className="drawer-product-card"
                style={{
                  width: "220px",
                  flexShrink: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    width: "220px",
                    aspectRatio: "3/4",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getMainImage(product)}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      display: "block",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "16px",
                    color: "#000",
                    margin: "8px 0 0",
                    letterSpacing: "0.02em",
                  }}
                >
                  {product.name}
                </h4>
                <span
                  style={{
                    fontFamily: "'Satoshi', sans-serif",
                    fontSize: "13px",
                    color: "#000",
                  }}
                >
                  {formatPrice(product.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Detail Panel (right slide-in) */}
      {selectedProduct && (
        <div
          ref={detailRef}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "100vh",
            background: "#ffffff",
            borderLeft: "0.5px solid #000",
            zIndex: 100,
            overflowY: "auto",
            transform: "translateX(400px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeDetail}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#000",
              zIndex: 5,
            }}
          >
            ✕
          </button>

          {/* Product image */}
          <div style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden" }}>
            <img
              src={getMainImage(selectedProduct)}
              alt={selectedProduct.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                display: "block",
              }}
            />
          </div>

          {/* Product info */}
          <div style={{ padding: "24px" }}>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "28px",
                color: "#000",
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              {selectedProduct.name}
            </h3>
            <p
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "16px",
                color: "#000",
                margin: "4px 0 12px",
              }}
            >
              {formatPrice(selectedProduct.price)}
            </p>
            <p
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13px",
                color: "#666",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              {selectedProduct.description}
            </p>

            {/* Size selector */}
            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#666",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                SIZE
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "0.5px solid #000",
                      background: selectedSize === size ? "#000" : "#fff",
                      color: selectedSize === size ? "#fff" : "#000",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color dots */}
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#666",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                COLOR
              </span>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { name: "black", hex: "#000000" },
                  { name: "white", hex: "#ffffff" },
                  { name: "charcoal", hex: "#4a4a4a" },
                  { name: "cream", hex: "#f4f0eb" },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: color.hex,
                      border: "0.5px solid rgba(0,0,0,0.2)",
                      cursor: "pointer",
                      outline: selectedColor === color.name ? "2px solid #000" : "none",
                      outlineOffset: "3px",
                      transition: "outline 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Add to Bag */}
            <button
              onClick={() =>
                alert(
                  `Added ${selectedProduct.name} (Size: ${selectedSize}, Color: ${selectedColor}) to bag.`
                )
              }
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                padding: "16px 0",
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              ADD TO BAG →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
