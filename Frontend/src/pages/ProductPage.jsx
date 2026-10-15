import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "../components/Footer";
import ReviewsSection from "../components/reviews/ReviewsSection";
import StarRating from "../components/reviews/StarRating";
import { fetchProductBySlug, fetchProducts, formatPrice, getMainImage, getModelImage } from "../lib/api";
import { useCart } from "../context/CartContext";

// Backward compatibility map for old IDs like "m1", "w1"
const OLD_ID_MAP = {
  m1: "blue-striped-shirt-with-clean-summer-vibes",
  m2: "dark-punk-stehkragen-patchwork-jacket",
  m3: "retro-80s-stripe-polo-long-sleeve-style",
  m4: "mens-short-sleeve-cropped-workwear-graphic-button-up-shirt",
  m5: "ribbed-collar-cropped-bomber-flight-jacket-subversive-archive",
  m6: "aelfric-eden-mens-wide-leg-sweatpants",
  m7: "ballon-washed-jeans",
  w1: "burgundy-crop-top",
  w2: "cropped-nike",
  w3: "dames-t-shirt-met-bloemenprint-raglan-korte-mouwen-halterhals-en-2-in-1-ontwerp",
  w4: "leilani-washed-baggy-jeans",
  w5: "mocha-butterfly-y2k-grunge-outfit",
  w6: "vrouwen-grafische-print-t-shirt-vintage-harajuku-y2k-tee-top-shoujo-meisje-esthetische-oversize",
  w7: "women-jeans",
};

const COLOR_HEX_MAP = {
  black: "#000000",
  white: "#ffffff",
  charcoal: "#4a4a4a",
  cream: "#f4f0eb",
};

export default function ProductPage() {
  const { slug, id } = useParams();
  const rawParam = slug || id;
  const effectiveSlug = OLD_ID_MAP[rawParam] || rawParam;

  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [bagText, setBagText] = useState("ADD TO BAG");
  const [selectionError, setSelectionError] = useState(null);
  const [openAccordion, setOpenAccordion] = useState(null);

  const { addToCart } = useCart();

  const mainImgRef = useRef(null);
  const infoRef = useRef(null);
  const storyRef = useRef(null);
  const relatedRef = useRef(null);
  const pageRef = useRef(null);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [effectiveSlug]);

  // Fetch product and related products
  const loadProductData = useCallback(async () => {
    if (!effectiveSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductBySlug(effectiveSlug);
      setProduct(data);
      const initialImg = getMainImage(data);
      setMainImage(initialImg);

      // Default size & color from available variants
      if (Array.isArray(data.variants) && data.variants.length > 0) {
        const inStockVariant = data.variants.find((v) => v.stock > 0) || data.variants[0];
        setSelectedSize(inStockVariant.size || "");
        setSelectedColor(inStockVariant.color || "");
      }

      // Fetch related items from the same section
      if (data.section) {
        fetchProducts({ section: data.section, limit: 6 })
          .then((items) => {
            setRelatedProducts(
              items.filter((p) => p.slug !== data.slug && p.id !== data.id).slice(0, 4)
            );
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [effectiveSlug]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  // Sync main image when product changes
  useEffect(() => {
    if (product) {
      setMainImage(getMainImage(product));
      setBagText("ADD TO BAG");
      setOpenAccordion(null);
    }
  }, [product]);

  // GSAP entrance animations
  useEffect(() => {
    if (!product || !pageRef.current) return;

    const ctx = gsap.context(() => {
      // Main image entrance
      if (mainImgRef.current) {
        gsap.from(mainImgRef.current, {
          x: -60,
          opacity: 0,
          duration: 1,
          ease: "power4.out",
        });
      }

      // Info section stagger
      const infoEl = infoRef.current;
      if (infoEl) {
        const children = infoEl.querySelectorAll(".pdp-animate");
        gsap.from(children, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.15,
          delay: 0.2,
        });
      }

      // Story section scroll trigger
      const storyEl = storyRef.current;
      if (storyEl) {
        const left = storyEl.querySelector(".story-left");
        const right = storyEl.querySelector(".story-right");
        if (left) {
          gsap.from(left, {
            x: -80,
            opacity: 0,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: storyEl, start: "top 75%", once: true },
          });
        }
        if (right) {
          gsap.from(right, {
            x: 80,
            opacity: 0,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: storyEl, start: "top 75%", once: true },
          });
        }
      }

      // Related products stagger
      const relatedEl = relatedRef.current;
      if (relatedEl) {
        const cards = relatedEl.querySelectorAll(".related-card");
        if (cards.length) {
          gsap.from(cards, {
            y: 60,
            opacity: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: relatedEl, start: "top 80%", once: true },
          });
        }
      }

      ScrollTrigger.refresh();
    }, pageRef);

    return () => ctx.revert();
  }, [product, effectiveSlug]);

  // Loading state
  if (loading && !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: "80px 20px" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", letterSpacing: "0.1em", color: "#000" }}>
          LOADING PRODUCT...
        </h2>
        <div style={{ marginTop: "16px", width: "48px", height: "1px", background: "#000" }} />
      </div>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", color: "#000", margin: "0 0 16px" }}>
          PRODUCT NOT FOUND
        </h2>
        <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "14px", color: "#666", maxWidth: "420px", margin: "0 0 28px" }}>
          {error}
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={loadProductData}
            style={{
              padding: "14px 32px",
              background: "#000",
              color: "#fff",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
            }}
          >
            RETRY
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "14px 32px",
              background: "#fff",
              color: "#000",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              border: "1px solid #000",
              cursor: "pointer",
            }}
          >
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Real sizes and colors from product.variants
  const variantSizes = Array.from(new Set(product.variants?.map((v) => v.size) || []));
  const sizesOrder = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
  const displaySizes = sizesOrder.filter((s) => variantSizes.includes(s));
  const sizesToRender = displaySizes.length > 0 ? displaySizes : sizesOrder;

  const variantColors = Array.from(new Set(product.variants?.map((v) => v.color || "") || []));
  const displayColors = variantColors
    .filter((name) => name.trim())
    .map((name) => ({ name, hex: COLOR_HEX_MAP[name.toLowerCase()] || name }));
  const hasColorChoice = displayColors.length > 0;
  const findVariant = (size, color = selectedColor) => product.variants?.find((variant) =>
    variant.size === size && (hasColorChoice ? variant.color === color : !String(variant.color || "").trim())
  );

  // Thumbnails: images array in documented order (images[0] = main, images[1] = model)
  const thumbnails = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [getMainImage(product), getModelImage(product)].filter(Boolean);

  // Thumbnail click handler
  const handleThumbClick = (img) => {
    if (img === mainImage) return;
    if (mainImgRef.current) {
      gsap.to(mainImgRef.current, {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          setMainImage(img);
          gsap.to(mainImgRef.current, { opacity: 1, duration: 0.3 });
        },
      });
    } else {
      setMainImage(img);
    }
  };

  // Currently selected variant based on user selection
  const currentVariant = findVariant(selectedSize);
  const isCurrentVariantOutOfStock = !currentVariant || currentVariant.stock <= 0;

  // Add to bag
  const handleAddToBag = () => {
    setSelectionError(null);
    if (!selectedSize || (hasColorChoice && !selectedColor)) {
      setSelectionError(hasColorChoice ? "Please select both a size and a color." : "Please select a size.");
      return;
    }

    if (!currentVariant || currentVariant.stock <= 0) {
      setSelectionError("Selected size & color combination is out of stock.");
      return;
    }

    try {
      addToCart({
        variantId: currentVariant.id,
        quantity: 1,
        slug: product.slug,
        name: product.name,
        size: currentVariant.size,
        color: currentVariant.color,
        image: getMainImage(product),
        price: product.price,
        maxStock: currentVariant.stock,
      });

      setBagText("ADDED TO BAG ✓");
      setTimeout(() => setBagText("ADD TO BAG"), 2500);
    } catch (err) {
      setSelectionError(err?.message || "Could not add item to bag");
    }
  };

  // Size click with GSAP flash
  const handleSizeClick = (size, e) => {
    setSelectedSize(size);
    gsap.fromTo(e.currentTarget, { scale: 0.92 }, { scale: 1, duration: 0.15 });
  };

  // Color click with GSAP scale
  const handleColorClick = (name, e) => {
    setSelectedColor(name);
    gsap.fromTo(e.currentTarget, { scale: 1.2 }, { scale: 1, duration: 0.2 });
  };

  // Accordion toggle
  const toggleAccordion = (key) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  return (
    <div ref={pageRef}>
      {/* Section 1 — Product Hero */}
      <section className="container-page product-detail-layout">
        {/* Left — Image Gallery */}
        <div className="product-detail-gallery">
          <div
            ref={mainImgRef}
            style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden", marginBottom: "16px" }}
          >
            <img
              src={mainImage}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
            />
          </div>
          {/* Thumbnails */}
          <div style={{ display: "flex", gap: "12px" }}>
            {thumbnails.map((img, i) => (
              <button
                key={i}
                onClick={() => handleThumbClick(img)}
                style={{
                  width: "80px",
                  height: "80px",
                  border: mainImage === img ? "1.5px solid #000" : "0.5px solid #000",
                  cursor: "pointer",
                  overflow: "hidden",
                  padding: 0,
                  background: "none",
                  opacity: mainImage === img ? 1 : 0.6,
                  transition: "all 0.2s",
                }}
              >
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right — Product Info (sticky) */}
        <div ref={infoRef} className="product-detail-info">
          {/* Brand */}
          <span className="pdp-animate" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#666", display: "block", marginBottom: "12px" }}>
            NEP AESTHETIC
          </span>

          {/* Name */}
          <h1 className="pdp-animate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px", color: "#000", lineHeight: 0.9, margin: "0 0 16px" }}>
            {product.name}
          </h1>

          {/* Price */}
          <p className="pdp-animate" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "22px", color: "#000", margin: "0 0 16px" }}>
            {formatPrice(product.price)}
          </p>

          {product.reviewCount > 0 && (
            <a className="pdp-animate product-review-summary-link" href="#reviews" aria-label={`Read ${product.reviewCount} customer reviews`}>
              <StarRating value={product.ratingAverage} count={product.reviewCount} />
              <span>{product.ratingAverage?.toFixed(1)} · {product.reviewCount} {product.reviewCount === 1 ? "REVIEW" : "REVIEWS"}</span>
            </a>
          )}

          {/* Divider */}
          <div className="pdp-animate" style={{ borderBottom: "0.5px solid #e0e0e0", marginBottom: "24px" }} />

          {/* Description */}
          <p className="pdp-animate" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "14px", color: "#555", lineHeight: 1.8, margin: "0 0 32px", maxWidth: "400px" }}>
            {product.description}
          </p>

          {/* Size selector from real API variants */}
          <div className="pdp-animate" style={{ marginBottom: "24px" }}>
            <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#000", display: "block", marginBottom: "12px" }}>
              SELECT SIZE
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {sizesToRender.map((size) => {
                const variant = findVariant(size);
                const isOutOfStock = variant ? variant.stock <= 0 : false;
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={(e) => !isOutOfStock && handleSizeClick(size, e)}
                    title={isOutOfStock ? `${size} (Out of stock)` : `Select size ${size}`}
                    style={{
                      minWidth: "48px",
                      height: "48px",
                      padding: "0 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isOutOfStock
                        ? "0.5px dashed #aaa"
                        : isSelected
                          ? "1.5px solid #000"
                          : "0.5px solid #000",
                      background: isOutOfStock
                        ? "#f5f5f5"
                        : isSelected
                          ? "#000"
                          : "#fff",
                      color: isOutOfStock
                        ? "#999"
                        : isSelected
                          ? "#fff"
                          : "#000",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "12px",
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                      opacity: isOutOfStock ? 0.45 : 1,
                      textDecoration: isOutOfStock ? "line-through" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <button style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", color: "#666", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", marginTop: "10px", padding: 0 }}>
              Size Guide
            </button>
          </div>

          {/* Color selector from real API variants */}
          {hasColorChoice && <div className="pdp-animate" style={{ marginBottom: "32px" }}>
            <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#000", display: "block", marginBottom: "12px" }}>
              COLOR
            </span>
            <div style={{ display: "flex", gap: "14px" }}>
              {displayColors.map((color) => (
                <button
                  key={color.name}
                  onClick={(e) => handleColorClick(color.name, e)}
                  title={color.name}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: color.hex,
                    border: "0.5px solid #ccc",
                    cursor: "pointer",
                    outline: selectedColor === color.name ? "2px solid #000" : "none",
                    outlineOffset: "3px",
                    transition: "outline 0.2s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>}

          {/* Selection error banner */}
          {selectionError && (
            <div style={{ padding: "10px 14px", background: "#fff1f0", borderLeft: "3px solid #E8521A", marginBottom: "16px" }}>
              <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "11px", color: "#b32400", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {selectionError}
              </p>
            </div>
          )}

          {/* Low stock alert */}
          {currentVariant && currentVariant.stock > 0 && currentVariant.stock <= 3 && (
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", color: "#E8521A", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: "bold" }}>
                ⚡ Only {currentVariant.stock} left in stock for selected size/color!
              </span>
            </div>
          )}

          {/* ADD TO BAG */}
          <button
            className="pdp-animate pdp-add-bag"
            onClick={handleAddToBag}
            disabled={isCurrentVariantOutOfStock}
            style={{
              width: "100%",
              height: "56px",
              background: isCurrentVariantOutOfStock ? "#777777" : "#000",
              color: "#fff",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "20px",
              border: "none",
              borderRadius: 0,
              cursor: isCurrentVariantOutOfStock ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
              letterSpacing: "0.05em",
              transition: "background 0.2s",
            }}
          >
            {isCurrentVariantOutOfStock ? "OUT OF STOCK" : bagText}
          </button>

          {/* SAVE TO WISHLIST */}
          <button
            className="pdp-animate pdp-wishlist-btn"
            style={{
              width: "100%",
              height: "48px",
              background: "#fff",
              color: "#000",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              border: "0.5px solid #000",
              borderRadius: 0,
              cursor: "pointer",
              marginTop: "12px",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
          >
            SAVE TO WISHLIST
          </button>

          {/* Divider */}
          <div className="pdp-animate" style={{ borderBottom: "0.5px solid #e0e0e0", margin: "32px 0" }} />

          {/* Accordions */}
          <Accordion
            title="PRODUCT DETAILS"
            open={openAccordion === "details"}
            onClick={() => toggleAccordion("details")}
          >
            <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
              <strong>Fabric:</strong> 80% Himalayan Wool, 20% Yak Fibre<br />
              <strong>Care:</strong> Dry clean only. Store flat or on padded hanger.<br />
              <strong>Origin:</strong> Handcrafted in Kathmandu, Nepal
            </p>
          </Accordion>

          <Accordion
            title="DELIVERY & RETURNS"
            open={openAccordion === "delivery"}
            onClick={() => toggleAccordion("delivery")}
          >
            <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
              Standard delivery: 5–7 business days<br />
              Express delivery: 2–3 business days<br />
              Free returns within 30 days of delivery.
            </p>
          </Accordion>

          <Accordion
            title="SIZE & FIT"
            open={openAccordion === "size"}
            onClick={() => toggleAccordion("size")}
          >
            <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
              Model is 6&apos;1&quot; / 185cm wearing size M.<br />
              Relaxed oversized fit — consider sizing down for a closer silhouette.
            </p>
          </Accordion>
        </div>
      </section>

      <ReviewsSection product={product} />

      {/* Section 2 — Product Story */}
      <section
        ref={storyRef}
        style={{
          width: "100vw",
          height: "60vh",
          background: "#000",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div className="story-left" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "72px", color: "#fff", lineHeight: 0.88, margin: "0 0 24px" }}>
            CRAFTED FOR<br />ALTITUDE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "14px", color: "#aaa", lineHeight: 1.7, maxWidth: "400px" }}>
            Each piece is meticulously crafted from locally sourced Himalayan materials — hand-spun wool,
            yak fibre, and heritage Dhaka textiles. The construction merges generations of Nepali weaving
            tradition with the precision of European tailoring.
          </p>
        </div>
        <div className="story-right" style={{ flex: 1, position: "relative" }}>
          <img
            src={getModelImage(product) || getMainImage(product)}
            alt={product.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
      </section>

      {/* Section 3 — You May Also Like */}
      <section ref={relatedRef} style={{ padding: "120px 80px", background: "#fff" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "64px", color: "#000", margin: "0 0 60px" }}>
          YOU MAY ALSO LIKE
        </h2>
        <div style={{ display: "flex", gap: "24px", overflowX: "auto" }} className="no-scrollbar">
          {relatedProducts.map((p) => (
            <div
              key={p.id || p.slug}
              className="related-card"
              onClick={() => navigate(`/product/${p.slug || p.id}`, { state: { product: p } })}
              style={{ width: "280px", flexShrink: 0, cursor: "pointer" }}
            >
              <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", border: "0.5px solid #000" }}>
                <img
                  src={getMainImage(p)}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.4s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              </div>
              <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#000", margin: "12px 0 4px", letterSpacing: "0.02em" }}>
                {p.name}
              </h4>
              <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "14px", color: "#000" }}>
                {formatPrice(p.price)}
              </span>
              {p.reviewCount > 0 && <span className="related-product-rating"><StarRating value={p.ratingAverage} count={p.reviewCount} /> {Number(p.ratingAverage).toFixed(1)} ({p.reviewCount})</span>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Accordion sub-component ── */
function Accordion({ title, open, onClick, children }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      gsap.fromTo(
        contentRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.4, ease: "power2.inOut" }
      );
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  }, [open]);

  return (
    <div style={{ borderBottom: "0.5px solid #e0e0e0" }}>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Satoshi', sans-serif",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#000",
        }}
      >
        {title}
        <span
          style={{
            fontSize: "18px",
            transition: "transform 0.3s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>
      <div ref={contentRef} style={{ overflow: "hidden", height: 0, opacity: 0 }}>
        <div style={{ paddingBottom: "20px" }}>{children}</div>
      </div>
    </div>
  );
}
