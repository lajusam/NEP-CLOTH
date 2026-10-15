import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatPrice, getMainImage, getModelImage } from "../lib/api";
import { interleaveByCategory } from "../lib/mixProducts";

gsap.registerPlugin(ScrollTrigger);

const MEN_CATEGORY_TABS = ["OUTERWEAR", "TOPS", "BOTTOMS", "FOOTWEAR", "CAPS"];
const WOMEN_CATEGORY_TABS = ["OUTERWEAR", "TOPS", "BOTTOMS", "ACCESSORIES", "BAGS"];

export default function ProductGrid({ products = [], page = "women" }) {
  const navigate = useNavigate();
  const isMen = page === "men";
  const isHome = page === "home";
  const categoryTabs = isMen ? MEN_CATEGORY_TABS : WOMEN_CATEGORY_TABS;
  const title = isHome ? "NEW ARRIVALS" : isMen ? "MEN'S COLLECTION" : "WOMEN'S COLLECTION";
  const subline = isHome
    ? "Our latest arrivals, merging traditional Nepali patterns with technical street silhouettes."
    : isMen
      ? "High-altitude utility reimagined with modern architectural tailoring."
      : "Traditional Nepali craftsmanship engineered for the contemporary silhouette.";
  const exploreLink = isMen ? "/men" : "/women";

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [mixSeed] = useState(() => Math.random());
  const sectionRef = useRef(null);
  const cardsRef = useRef(null);

  // Use the "category" field from the API instead of guessing from keywords
  const mixedProducts = useMemo(() => interleaveByCategory(products || [], mixSeed), [products, mixSeed]);
  const tabs = useMemo(() => ["ALL", "NEW IN", ...categoryTabs.filter((tab) =>
    products.some((product) => (product.category || "").toUpperCase() === tab)
  )], [categoryTabs, products]);
  const selectedFilter = tabs.includes(activeFilter) ? activeFilter : "ALL";
  const filteredProducts = useMemo(() => {
    if (selectedFilter === "ALL") return mixedProducts;
    if (selectedFilter === "NEW IN") return isHome ? mixedProducts : mixedProducts.slice(0, 8);
    return (products || []).filter((product) => {
    const cat = (product.category || "").toUpperCase();
      return cat === selectedFilter;
    });
  }, [isHome, mixedProducts, products, selectedFilter]);

  useEffect(() => {
    if (!sectionRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { y: 40, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 92%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Pop each card in with a staggered reveal every time the visible set
  // changes — on first mount AND whenever the filter tab changes.
  useLayoutEffect(() => {
    const cards = cardsRef.current?.querySelectorAll(".carousel-card");
    if (!cards?.length) return undefined;
    const tween = gsap.fromTo(cards,
      { autoAlpha: 0, y: 36, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", clearProps: "all" }
    );
    return () => tween.kill();
  }, [filteredProducts]);

  const openProduct = (product) => {
    navigate(`/product/${product.slug || product.id}`, { state: { product } });
  };

  return (
    <section ref={sectionRef} className={`product-collection-section w-full bg-stark-white ${isHome ? "py-[120px]" : "product-grid-editorial"}`}>
      <div className={`container-page ${isHome ? "" : "product-grid-editorial-content"}`}>
      <div className="product-grid-heading flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pb-6 border-b border-black">
        <div>
          <h2 className="font-display text-[64px] leading-none text-black uppercase">{title}</h2>
          <p className="font-sans text-[13px] text-[#666] mt-2">{subline}</p>
        </div>
        <Link to={exploreLink} className="font-sans text-[11px] uppercase tracking-[0.15em] text-black border-b border-black pb-1 hover:opacity-70 transition-opacity">EXPLORE ALL →</Link>
      </div>

      <div className="product-filter-sticky w-full flex justify-center border-b border-black/10" aria-label="Filter products">
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveFilter(tab)} aria-pressed={selectedFilter === tab}
              className={`font-sans text-[11px] uppercase tracking-[0.15em] py-4 text-black transition-all cursor-pointer ${activeFilter === tab ? "border-b-[1.5px] border-black font-bold" : "border-b-[1.5px] border-transparent hover:underline"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length ? (
        <div ref={cardsRef} className="product-carousel-track flex items-start gap-6 md:gap-10 overflow-x-auto no-scrollbar py-12 snap-x snap-mandatory">
          {filteredProducts.map((product) => {
            const mainImage = getMainImage(product);
            const alternateImage = isHome ? null : getModelImage(product);
            const hasAlternate = Boolean(alternateImage && alternateImage !== mainImage);
            return (
            <button key={product.id || product.slug} type="button" onClick={() => openProduct(product)}
              className={`carousel-card group flex-none relative w-[240px] md:w-[280px] text-left snap-start select-none ${hasAlternate ? "has-product-alt" : ""}`}>
              <span className={`block relative w-full overflow-hidden border border-black/15 bg-[#f4f0eb] ${isHome ? "" : "product-tile-image"}`} style={{ aspectRatio: isHome ? "2/3" : "4/5" }}>
                <img
                  src={mainImage}
                  alt={product.name}
                  className="product-grid-image w-full h-full object-cover object-top"
                  {...(isHome ? {} : { width: 800, height: 1000, loading: "lazy", decoding: "async" })}
                />
                {hasAlternate && (
                  <img
                    src={alternateImage}
                    alt=""
                    aria-hidden="true"
                    className="product-grid-image product-grid-image-secondary w-full h-full object-cover object-top"
                    width="800"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span className="product-card-caption absolute inset-x-0 bottom-0 flex justify-between items-center bg-white/95 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.12em]">
                  <span>VIEW DETAILS</span><span aria-hidden="true">↗</span>
                </span>
              </span>
              <span className="mt-4 flex justify-between items-start gap-3">
                <span className="font-display text-lg leading-tight text-black">{product.name}</span>
                <span className="font-sans text-xs text-black whitespace-nowrap">{formatPrice(product.price)}</span>
              </span>
            </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full text-center py-20 font-sans text-sm text-[#666] uppercase tracking-wider">No products found in this category.</div>
      )}
      </div>
    </section>
  );
}
