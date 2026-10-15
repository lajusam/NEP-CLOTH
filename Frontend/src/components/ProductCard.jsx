import { useState } from "react";
import { formatPrice, getMainImage } from "../lib/api";

export default function ProductCard({ product, isOpen, onToggle }) {
  const [liked, setLiked] = useState(false);
  const imageSrc = getMainImage(product);
  const priceDisplay = formatPrice(product?.price);
  const ratingValue = Number(product?.ratingAverage) || 0;
  const reviewCount = Number(product?.reviewCount) || 0;

  return (
    <div
      className="product-card flex-none w-[280px] md:w-[320px] snap-center bg-stark-white border border-obsidian cursor-pointer group/card"
      onClick={onToggle}
    >
      {/* Product photo stays visible; hover only adds a subtle zoom. */}
      <div className="relative w-full overflow-hidden border-b border-obsidian" style={{ aspectRatio: "3/4" }}>
        <img
          src={imageSrc}
          alt={product?.name}
          className="absolute inset-0 w-full h-full product-img-hover"
          style={{ objectFit: "cover", objectPosition: "top center" }}
        />
        <button
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-stark-white/80 backdrop-blur-sm text-obsidian hover:text-altitude-orange transition-colors z-10 text-lg"
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {/* Title + Price */}
      <div className="p-5 flex justify-between items-start">
        <h3 className="font-display text-[20px] leading-none text-obsidian tracking-wide">
          {product?.name}
        </h3>
        <span className="font-sans text-[14px] text-obsidian whitespace-nowrap ml-2">
          {priceDisplay}
        </span>
      </div>

      {/* Expandable Details Panel */}
      <div className={`product-expand-panel ${isOpen ? "open" : ""}`}>
        <div className="product-expand-inner">
          <div className="px-4 pb-4 flex flex-col gap-3">
            <p className="font-sans text-[13px] text-secondary leading-relaxed border-t border-obsidian/20 pt-3">
              {product?.description}
            </p>
            {reviewCount > 0 && ratingValue > 0 && (
              <div className="flex items-center gap-1 text-[12px] text-obsidian">
                <span aria-hidden="true">★</span>
                <span className="text-secondary ml-1">{ratingValue.toFixed(1)} ({reviewCount})</span>
              </div>
            )}
            <button
              className="w-full bg-obsidian text-stark-white font-sans text-[10px] tracking-[0.2em] uppercase py-3 hover:bg-altitude-orange transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              ADD TO BAG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
