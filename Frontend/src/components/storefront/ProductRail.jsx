import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { EmptyState, ErrorState, RailSkeleton } from "./StorefrontStates";

export default function ProductRail({ products, loading, error, onRetry, label, stableLoading = false, emptyText }) {
  const viewportRef = useRef(null);
  const [position, setPosition] = useState({ start: true, end: false, overflow: false });
  const updatePosition = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPosition({ start: el.scrollLeft <= 2, end: max <= 2 || el.scrollLeft >= max - 2, overflow: max > 2 });
  }, []);
  useEffect(() => {
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [products, updatePosition, loading]);
  const move = (direction) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(1, el.clientWidth - 48), behavior: "smooth" });
  };
  const items = products?.length ? <div className="storefront-rail-frame">
    <div className={`storefront-rail${products.length < 3 ? " storefront-rail-few" : ""}`} ref={viewportRef} onScroll={updatePosition} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0} data-product-rail>
      {products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}
    </div>
    {position.overflow && products.length >= 3 && <>
      {!position.start && <button type="button" className="storefront-rail-arrow left" onClick={() => move(-1)} aria-label="Previous products"><ChevronLeft aria-hidden="true" /></button>}
      {!position.end && <button type="button" className="storefront-rail-arrow right" onClick={() => move(1)} aria-label="Next products"><ChevronRight aria-hidden="true" /></button>}
    </>}
  </div> : <EmptyState>{emptyText}</EmptyState>;

  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !stableLoading) return <RailSkeleton />;
  if (loading && stableLoading) return <div className="storefront-rail-loading" aria-busy="true"><RailSkeleton count={Math.max(2, Math.min(products?.length || 4, 4))} /></div>;
  return items;
}
