import { useRef } from "react";
import { Link } from "react-router-dom";
import { useSlideIn } from "../hooks/useGSAP";
import MediaOverlay from "./MediaOverlay";

export default function EditorialSection({
  image,
  headline,
  body,
  ctaText,
  ctaLink,
  eyebrow,
  reversed = false,
  darkBg = false,
  revealHeading = false,
}) {
  const textRef = useRef(null);
  const imgRef = useRef(null);
  useSlideIn(textRef, reversed ? "right" : "left");
  useSlideIn(imgRef, reversed ? "left" : "right");

  if (darkBg) {
    // Full-width dark editorial with centered text over image
    return (
        <section className="h-[60vh] w-full bg-obsidian flex flex-col items-center justify-center relative overflow-hidden gap-8 px-6 md:px-20">
        <div className="absolute inset-0 z-0">
          <img
            src={image}
            alt={headline}
            className="w-full h-full object-cover opacity-60"
            style={{ objectPosition: "center 15%" }}
          />
        </div>
        <MediaOverlay variant="strong" />
        <div ref={textRef} className="relative z-10 text-center flex flex-col items-center gap-4">
          <h2 className="font-display text-stark-white text-[clamp(48px,8vw,90px)] leading-none tracking-tight">
            {headline}
          </h2>
          {body && (
            <p className="font-editorial text-stark-white text-[14px] text-center max-w-[500px]">
              {body}
            </p>
          )}
          {ctaText && ctaLink && (
            <Link
              to={ctaLink}
              className="font-sans text-stark-white text-[14px] uppercase border-b border-stark-white pb-1 mt-2 hover:text-altitude-orange hover:border-altitude-orange transition-colors"
            >
              {ctaText} →
            </Link>
          )}
        </div>
      </section>
    );
  }

  // Split layout editorial
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 border-y border-obsidian">
      <div
        ref={textRef}
        className={`bg-stark-white p-8 md:p-20 flex flex-col justify-center border-b md:border-b-0 ${
          reversed ? "md:order-2 md:border-l" : "md:border-r"
        } border-obsidian`}
      >
        {eyebrow && (
          <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-4">
            {eyebrow}
          </span>
        )}
        <h2 data-revealed={revealHeading ? "true" : undefined} className="font-display text-6xl md:text-8xl text-obsidian uppercase tracking-tighter mb-8 leading-none">
          {headline}
        </h2>
        {body && (
          <p className="font-editorial text-[15px] leading-[1.8] text-obsidian max-w-md mb-8">
            {body}
          </p>
        )}
        {ctaText && ctaLink && (
          <Link
            to={ctaLink}
            className="font-sans text-[10px] text-obsidian uppercase tracking-[0.2em] border-b border-obsidian pb-1 w-max hover:text-altitude-orange hover:border-altitude-orange transition-colors"
          >
            {ctaText} →
          </Link>
        )}
      </div>
      <div
        ref={imgRef}
        className={`bg-obsidian h-[60vh] md:h-auto ${reversed ? "md:order-1" : ""}`}
      >
        <img
          src={image}
          alt={headline}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 15%" }}
        />
      </div>
    </section>
  );
}
