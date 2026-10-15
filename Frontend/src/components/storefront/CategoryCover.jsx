import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import MediaOverlay from "../MediaOverlay";

function scrollToSection(event, targetId) {
  if (!targetId) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  const heading = target.matches("h2") ? target : target.querySelector("h2");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
}

export default function CategoryCover({
  image,
  srcSet,
  sizes = "(min-width: 1400px) 1360px, calc(100vw - 32px)",
  width,
  height,
  title,
  ariaLabel,
  targetId,
  href,
  objectPosition = "center",
  hasProducts = true,
}) {
  const imageRef = useRef(null);
  const ctaRef = useRef(null);
  const destination = href || (targetId ? `#${targetId}` : undefined);

  if (!image) return null;

  const handlePointerEnter = () => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (canHover && !reduceMotion && imageRef.current) {
      gsap.to(imageRef.current, { scale: 1.12 * 1.03, duration: 0.5, ease: "power2.out", overwrite: "auto" });
    }
  };

  const handlePointerMove = (event) => {
    const canMagnet = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canMagnet || reduceMotion || !ctaRef.current) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const x = Math.max(-6, Math.min(6, (event.clientX - (rect.left + rect.width / 2)) * 0.08));
    const y = Math.max(-6, Math.min(6, (event.clientY - (rect.top + rect.height / 2)) * 0.08));
    gsap.to(ctaRef.current, { x, y, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  };

  const handlePointerLeave = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (imageRef.current) gsap.to(imageRef.current, { scale: 1.12, duration: reduceMotion ? 0 : 0.5, ease: "power2.out", overwrite: "auto" });
    if (ctaRef.current) gsap.to(ctaRef.current, { x: 0, y: 0, duration: reduceMotion ? 0 : 0.35, ease: "power2.out", overwrite: "auto" });
  };

  const contents = (
    <>
      <img
        ref={imageRef}
        className="category-cover-image"
        src={image}
        srcSet={srcSet}
        sizes={sizes}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        style={{ objectPosition }}
        data-category-cover-image
      />
      <MediaOverlay className="category-cover-overlay" />
      <span className="category-cover-copy">
        <span className="category-cover-title-mask">
          <span data-category-cover-title aria-hidden="true">{title}</span>
        </span>
        {hasProducts && (
          <span ref={ctaRef} className="category-cover-cta" data-category-cover-cta>
            <span>DISCOVER THE COLLECTION</span>
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        )}
      </span>
    </>
  );

  const className = "category-cover";
  if (!hasProducts || !destination) {
    return <div className={className} role="img" aria-label={ariaLabel || `${title} collection`} data-category-cover>{contents}</div>;
  }

  return (
    <a
      className={className}
      href={destination}
      aria-label={ariaLabel || `Discover the ${title.toLowerCase()} collection`}
      data-category-cover
      onClick={(event) => scrollToSection(event, targetId)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {contents}
    </a>
  );
}
