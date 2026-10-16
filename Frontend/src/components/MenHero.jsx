import React, { useLayoutEffect, useEffect, useRef } from "react";
import gsap from "gsap";
import "./MenHero.css";

// Safe isomorphic layout effect that works in both client-rendered React and Next.js (SSR)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * MenHero Component
 * 
 * Fluid Men's Hero section built with React + GSAP.
 * Features:
 * - Fluid 3:2 aspect-ratio wrapper with container-type: inline-size
 * - Zero fixed px fonts / hardcoded viewport positions (all cqw and % based)
 * - Text-free background image with object-fit: cover (/images/male-section.jpg)
 * - Masked slide-up typography entrance animation with GSAP timeline
 * - Reduced motion accessibility support (prefers-reduced-motion)
 */
export default function MenHero({
  // Path to the text-free background image (1264x848, 3:2 aspect ratio)
  imageSrc = "/images/male-section.jpg",
  // Accessible image description
  alt = "Men's Collection 23/24 Campaign Hero",
}) {
  // Container wrapper reference (bounds gsap.context scope)
  const wrapperRef = useRef(null);

  // Background image reference
  const imgRef = useRef(null);

  // Individual text line references for GSAP timeline targeting
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);

  useIsomorphicLayoutEffect(() => {
    // 6. Respect prefers-reduced-motion: skip animation and show final state
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 5. Use gsap.context() inside useLayoutEffect with refs, revert on cleanup
    const ctx = gsap.context(() => {
      const img = imgRef.current;
      const lines = [line1Ref.current, line2Ref.current, line3Ref.current].filter(Boolean);

      if (prefersReducedMotion) {
        gsap.set(img, {
          opacity: 1,
          clipPath: "inset(0 0 0% 0)",
          scale: 1,
        });
        gsap.set(lines, {
          yPercent: 0,
          opacity: 1,
        });
        return;
      }

      // 1. Initial state: image scale 1.15, opacity 0, clip-path: inset(0 0 100% 0)
      gsap.set(img, {
        scale: 1.15,
        opacity: 0,
        clipPath: "inset(0 0 100% 0)",
      });

      // 3. GSAP Timeline (runs on every page load/reload)
      // Ease defaults to "power4.out" for a refined, modern editorial deceleration curve
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
      });

      // 4. Image animates FIRST. The text starts only once the image is ~70% revealed ("-=0.4" offset).
      tl.to(img, {
        // Final image opacity: fully opaque
        opacity: 1,
        // Final clip-path: fully unmasked from bottom
        clipPath: "inset(0 0 0% 0)",
        // Final scale: settles smoothly to standard scale 1
        scale: 1,
        // Duration: 1.4s for luxurious editorial pacing
        duration: 1.4,
      })
        // 2 & 3. Masked slide-up reveal: animate inner span from yPercent: 110 to 0
        .from(
          lines,
          {
            // Translates each line 110% downward behind its overflow:hidden mask
            yPercent: 110,
            // Slide-up duration: 1s
            duration: 1,
            // Staggers each line by 0.15s for sequential typography flow
            stagger: 0.15,
          },
          // Offset: starts 0.4s before image tween completes (~71% into image reveal)
          "-=0.4"
        )
        // Simultaneous opacity reveal
        .from(
          lines,
          {
            // Starts invisible
            opacity: 0,
            // Fade-in duration: 0.6s
            duration: 0.6,
            // Synchronized stagger matching slide-up
            stagger: 0.15,
          },
          // Starts concurrently with previous slide-up tween
          "<"
        );
    }, wrapperRef);

    // Cleanup GSAP context on unmount to prevent leaks and state duplication
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="men-hero-wrapper"
      aria-label="Men's Hero Section"
    >
      {/* Background Image: 3:2 ratio, text-free */}
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet="/optimized/images/male-section-480.webp 480w, /optimized/images/male-section-768.webp 768w"
        sizes="100vw"
        width="1264"
        height="848"
        alt={alt}
        className="men-hero-img"
        loading="eager"
        fetchPriority="high"
      />

      {/* Live HTML Typography Overlay (Scales with cqw) */}
      <div className="men-hero-text-block">
        {/* Line 1: "SALE  30% OFF" with two non-collapsing spaces */}
        <span className="men-hero-line-mask">
          <span ref={line1Ref} className="men-hero-line men-hero-line-1">
            SALE{"\u00A0\u00A0"}30% OFF
          </span>
        </span>

        {/* Line 2: "COLLECTION 23/24" (widest line spanning 51% width) */}
        <span className="men-hero-line-mask">
          <span ref={line2Ref} className="men-hero-line men-hero-line-2">
            COLLECTION 23/24
          </span>
        </span>

        {/* Line 3: "NEP-CLOTH" (brand sub-mark) */}
        <span className="men-hero-line-mask">
          <span ref={line3Ref} className="men-hero-line men-hero-line-3">
            NEP-CLOTH
          </span>
        </span>
      </div>
    </section>
  );
}
