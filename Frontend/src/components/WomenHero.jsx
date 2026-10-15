import { useLayoutEffect, useEffect, useRef } from "react";
import gsap from "gsap";
import "./WomenHero.css";

// Safe isomorphic layout effect (works in both client-rendered React and Next.js SSR)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Helper: split a text string into word-level <span> elements.
 * Each word gets className "women-hero-word" for GSAP targeting.
 * Spaces between words are preserved as inline whitespace.
 */
function splitWords(text) {
  return text.split(/(\s+)/).map((chunk, i) => {
    if (/^\s+$/.test(chunk)) {
      // Preserve whitespace as-is (non-breaking if needed)
      return <span key={i}>{chunk}</span>;
    }
    return (
      <span key={i} className="women-hero-word">
        {chunk}
      </span>
    );
  });
}

/**
 * WomenHero Component
 *
 * Cinematic Women's Hero section with serif quote overlay.
 * Features:
 * - Fluid 16:9 wrapper with container-type: inline-size
 * - All sizes in cqw / % — zero fixed px fonts or viewport positions
 * - Soft left-side gradient overlay for text legibility
 * - Word-level GSAP entrance with cinematic image de-blur
 * - Ambient slow-zoom loop after intro
 * - prefers-reduced-motion accessibility
 */
export default function WomenHero({
  // Path to the text-free background image (16:9, ~1376×768)
  imageSrc = "/images/women-section.jpg",
  // Accessible image description
  alt = "Women's Collection — Editorial Campaign",
  // Quote text — swap "NEP-CLOTH" for any brand name
  quoteLine1 = "If you fall,",
  quoteLine2 = "fall in NEP-CLOTH.",
  // Brand mark text (bottom-right)
  brandText = "NEP-CLOTH",
}) {
  // Container wrapper ref (bounds gsap.context scope)
  const wrapperRef = useRef(null);
  // Background image ref
  const imgRef = useRef(null);
  // Quote line refs (for word-level targeting)
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  // Decorative rule ref
  const ruleRef = useRef(null);
  // Brand mark ref
  const brandRef = useRef(null);

  useIsomorphicLayoutEffect(() => {
    // 7. Respect prefers-reduced-motion: skip animation, show final state
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 6. Use gsap.context() inside useLayoutEffect with refs, revert on cleanup
    const ctx = gsap.context(() => {
      const img = imgRef.current;
      const rule = ruleRef.current;
      const brand = brandRef.current;

      // Gather word spans from each line
      const line1Words = line1Ref.current
        ? Array.from(line1Ref.current.querySelectorAll(".women-hero-word"))
        : [];
      const line2Words = line2Ref.current
        ? Array.from(line2Ref.current.querySelectorAll(".women-hero-word"))
        : [];

      if (prefersReducedMotion) {
        // Show final settled state immediately
        if (img) {
          gsap.set(img, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" });
        }
        gsap.set([...line1Words, ...line2Words], { yPercent: 0, opacity: 1, filter: "none", rotation: 0 });
        if (rule) gsap.set(rule, { scaleX: 1 });
        if (brand) gsap.set(brand, { opacity: 0.9, letterSpacing: "0.45em" });
        return;
      }

      // 1. Initial state: image opacity 0, scale 1.12, filter blur(12px) brightness(0.6)
      if (img) {
        gsap.set(img, {
          opacity: 0,
          scale: 1.12,
          filter: "blur(12px) brightness(0.6)",
        });
      }

      // 3. Timeline
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // a) Image first: slow cinematic fade-in and de-blur (2s)
      if (img) {
        tl.to(img, {
          // Final opacity: fully visible
          opacity: 1,
          // Final scale: settled at natural size
          scale: 1,
          // Final filter: clear, no blur, normal brightness
          filter: "blur(0px) brightness(1)",
          // Duration: 2s for slow cinematic pacing
          duration: 2,
        });
      }

      // b) Line 1 words drift down softly (starts ~45% into image reveal via -=1.1)
      if (line1Words.length) {
        tl.from(
          line1Words,
          {
            // Drift from 60% above
            yPercent: -60,
            // Start invisible
            opacity: 0,
            // Soft blur on each word
            filter: "blur(6px)",
            // Duration: 1s per word
            duration: 1,
            // Stagger: 0.12s between words
            stagger: 0.12,
          },
          // Offset: starts 1.1s before image completes (~45% visible)
          "-=1.1"
        );
      }

      // c) Line 2 "falls" in with slight rotation, echoing the quote
      if (line2Words.length) {
        tl.from(
          line2Words,
          {
            // Slight upward offset
            y: "-1.5cqw",
            // Subtle tilt rotation
            rotation: -4,
            // Start invisible
            opacity: 0,
            // Duration: 0.9s
            duration: 0.9,
            // Stagger: 0.15s between words
            stagger: 0.15,
            // Ease: back.out for a slight overshoot "fall" feel
            ease: "back.out(1.4)",
          },
          // Offset: overlaps slightly with line 1
          "-=0.3"
        );
      }

      // d) Thin decorative rule draws out from left
      if (rule) {
        tl.from(
          rule,
          {
            // Start collapsed
            scaleX: 0,
            // Duration: 0.9s
            duration: 0.9,
            // Ease: smooth in-out for drawing effect
            ease: "power2.inOut",
          },
          "-=0.4"
        );
      }

      // e) Brand text fades in last with letter-spacing compression
      if (brand) {
        tl.from(
          brand,
          {
            // Start invisible
            opacity: 0,
            // Start with wider spacing, compress to final
            letterSpacing: "0.8em",
            // Duration: 1.4s for slow, quiet reveal
            duration: 1.4,
          },
          "-=0.3"
        );
      }

      // 4. Ambient slow-zoom loop after intro completes
      if (img) {
        tl.call(() => {
          gsap.to(img, {
            // Gentle zoom to 1.04
            scale: 1.04,
            // Very slow: 14s
            duration: 14,
            // Ease: smooth sine wave
            ease: "sine.inOut",
            // Yoyo: zoom in and out
            yoyo: true,
            // Repeat forever
            repeat: -1,
          });
        });
      }
    }, wrapperRef);

    // Cleanup GSAP context on unmount
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="women-hero-wrapper"
      aria-label="Women's Hero Section"
    >
      {/* Background Image: 16:9 ratio, text-free */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className="women-hero-img"
        loading="eager"
        fetchPriority="high"
      />

      {/* Gradient overlay: dark left, transparent right */}
      <div className="women-hero-gradient" aria-hidden="true" />

      {/* Quote Block (top-left, serif italic) */}
      <div className="women-hero-quote">
        {/* Line 1: "If you fall," */}
        <span ref={line1Ref} className="women-hero-quote-line1">
          {splitWords(quoteLine1)}
        </span>

        {/* Line 2: "fall in NEP-CLOTH." (indented, heavier) */}
        <span ref={line2Ref} className="women-hero-quote-line2">
          {splitWords(quoteLine2)}
        </span>

        {/* Decorative thin rule under quote */}
        <div ref={ruleRef} className="women-hero-rule" />
      </div>

      {/* Brand mark (bottom-right, small and quiet) */}
      <span ref={brandRef} className="women-hero-brand">
        {brandText}
      </span>
    </section>
  );
}
