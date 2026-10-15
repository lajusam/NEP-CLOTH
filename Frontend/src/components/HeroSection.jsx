import { useRef } from "react";
import { Link } from "react-router-dom";
import { useHeroAnimation, useParallax } from "../hooks/useGSAP";

export default function HeroSection({
  image,
  title,
  subtitle,
  eyebrow,
  ctaText,
  ctaLink,
  overlay = true,
  darkText = false,
  objectPosition = "center 15%",
}) {
  const titleRef = useRef(null);
  const bgRef = useRef(null);
  useHeroAnimation(titleRef);
  useParallax(bgRef);

  return (
    <header className="relative w-full min-h-screen overflow-hidden flex items-end">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          ref={bgRef}
          src={image}
          alt={typeof title === "string" ? title : "Hero"}
          className="w-full h-[120%] object-cover"
          style={{ objectPosition }}
        />
      </div>

      {/* Overlay gradient */}
      {overlay && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 50%)",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 w-full p-4 md:p-16 pb-12">
        {eyebrow && (
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-4">
            {eyebrow}
          </span>
        )}
        <div ref={titleRef}>
          <h1
            className={`font-display hero-title-clamp tracking-tighter uppercase ${
              darkText ? "text-obsidian" : "text-stark-white"
            }`}
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <p
            className={`font-editorial text-[15px] leading-relaxed max-w-md mt-6 ${
              darkText ? "text-obsidian" : "text-stark-white"
            }`}
          >
            {subtitle}
          </p>
        )}
        {ctaText && ctaLink && (
          <Link
            to={ctaLink}
            className={`font-sans text-[10px] uppercase tracking-[0.2em] border-b pb-1 mt-8 inline-block transition-colors hover:text-altitude-orange hover:border-altitude-orange ${
              darkText
                ? "text-obsidian border-obsidian"
                : "text-stark-white border-stark-white"
            }`}
          >
            {ctaText} <span className="inline-block ml-1">→</span>
          </Link>
        )}
      </div>
    </header>
  );
}
