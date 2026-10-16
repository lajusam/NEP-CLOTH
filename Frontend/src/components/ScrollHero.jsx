import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { IMAGES } from "../data/images";

/*
 * ─── ANIMATION TIMING CONFIG ────────────────────────────────────────────
 * All delays/durations in one place for easy retuning.
 */
const TIMING = {
  // Phase 1: Model image fade-in + scale
  model: { delay: 0, duration: 0.6, scaleFrom: 1.05 },
  // Phase 2: Wordmark clip-path wipe (left→right)
  wordmark: { delay: 0.6, duration: 0.8 },
  // Phase 3: Eyebrow + collection label slide-up + fade (staggered)
  labels: { delay: 1.0, duration: 0.6, stagger: 0.1, yFrom: 10 },
  // Phase 4: Buttons fade + scale
  buttons: { delay: 1.4, duration: 0.4, scaleFrom: 0.95 },
};

export default function ScrollHero() {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Check reduced-motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const modelImg = container.querySelector("[data-hero-model]");
    const nepWord = container.querySelector("[data-hero-nep]");
    const clothWord = container.querySelector("[data-hero-cloth]");
    const eyebrow = container.querySelector("[data-hero-eyebrow]");
    const collectionLabel = container.querySelector("[data-hero-collection]");
    const buttons = container.querySelector("[data-hero-buttons]");

    const allEls = [modelImg, nepWord, clothWord, eyebrow, collectionLabel, buttons].filter(Boolean);

    if (prefersReduced) {
      // Reduced motion: simple opacity fade, no movement/clip/scale
      allEls.forEach((el) => {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      });
      // Reveal clip-path immediately
      if (nepWord) nepWord.style.clipPath = "inset(0 0% 0 0)";
      if (clothWord) clothWord.style.clipPath = "inset(0 0% 0 0)";
      return;
    }

    // ── Phase 1: Model image — fade in + scale 1.05 → 1 ──────────────────
    if (modelImg) {
      gsap.fromTo(
        modelImg,
        { opacity: 0, scale: TIMING.model.scaleFrom },
        {
          opacity: 1,
          scale: 1,
          duration: TIMING.model.duration,
          delay: TIMING.model.delay,
          ease: "power3.out",
        }
      );
    }

    // ── Phase 2: Wordmark clip-path wipe left→right ──────────────────────
    [nepWord, clothWord].forEach((el) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: TIMING.wordmark.duration,
          delay: TIMING.wordmark.delay,
          ease: "power4.inOut",
        }
      );
    });

    // ── Phase 3: Eyebrow + collection label slide up + fade ──────────────
    const labelEls = [eyebrow, collectionLabel].filter(Boolean);
    labelEls.forEach((el, i) => {
      gsap.fromTo(
        el,
        { y: TIMING.labels.yFrom, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: TIMING.labels.duration,
          delay: TIMING.labels.delay + i * TIMING.labels.stagger,
          ease: "power3.out",
        }
      );
    });

    // ── Phase 4: Buttons fade + scale ────────────────────────────────────
    if (buttons) {
      gsap.fromTo(
        buttons,
        { opacity: 0, scale: TIMING.buttons.scaleFrom },
        {
          opacity: 1,
          scale: 1,
          duration: TIMING.buttons.duration,
          delay: TIMING.buttons.delay,
          ease: "power3.out",
        }
      );
    }
  }, []);

  return (
    <div
      id="scroll-hero-outer"
      ref={containerRef}
      className="hero-section"
    >
      {/* Model image — z-index 3 (above wordmark) */}
      <img
        data-hero-model
        src={IMAGES.heroClean}
        srcSet="/optimized/herosectionimg/hero-clean-480.webp 480w, /optimized/herosectionimg/hero-clean-768.webp 768w, /optimized/herosectionimg/hero-clean-1280.webp 1280w"
        sizes="100vw"
        width="1365"
        height="768"
        fetchPriority="high"
        decoding="async"
        alt="Nep Cloth Hero"
        className="hero-model-img"
      />

      {/* Giant wordmark — z-index 2 (behind model) */}
      <div className="hero-wordmark" aria-hidden="true">
        <span data-hero-nep className="hero-wordmark-text hero-wordmark-nep">NEP</span>
        <span data-hero-cloth className="hero-wordmark-text hero-wordmark-cloth">CLOTH</span>
      </div>

      {/* Eyebrow — top left — z-index 4 */}
      <div data-hero-eyebrow className="hero-eyebrow">
        <p>
          FASHION<br />THAT MOVES<br />WITH YOU.
        </p>
        <div className="hero-eyebrow-rule" />
      </div>

      {/* Buttons — bottom left — z-index 4 */}
      <div data-hero-buttons className="hero-buttons">
        <Link to="/women" className="hero-btn hero-btn-filled">SHOP NOW</Link>
        <Link to="/women" className="hero-btn hero-btn-outline">EXPLORE NEW IN</Link>
      </div>

      {/* Collection label — bottom right — z-index 4 */}
      <div data-hero-collection className="hero-collection-label">
        <p>
          NEW<br />COLLECTION<br />2026
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator">
        <span>SCROLL</span>
        <div className="hero-scroll-track">
          <div className="hero-scroll-line scroll-indicator-line" />
        </div>
      </div>
    </div>
  );
}
