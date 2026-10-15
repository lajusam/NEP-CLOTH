import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MediaOverlay from "./MediaOverlay";
import "./CollectionClosingBanner.css";

gsap.registerPlugin(ScrollTrigger);

export default function CollectionClosingBanner({ image, alt, title, body, ctaText, ctaLink }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        });

        timeline
          .fromTo("[data-closing-image]", { scale: 1.1 }, {
            scale: 1, duration: 1.5, ease: "power3.out", immediateRender: false,
          }, 0)
          .fromTo("[data-closing-title]", { yPercent: 110 }, {
            yPercent: 0, duration: 0.9, ease: "power3.out", immediateRender: false,
          }, 0.15)
          .fromTo("[data-closing-copy]", { autoAlpha: 0, y: 18 }, {
            autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12,
            ease: "power3.out", immediateRender: false,
          }, 0.35);
      }, section);

      return () => context.revert();
    });

    const refresh = () => ScrollTrigger.refresh();
    const imageElement = section.querySelector("img");
    imageElement?.addEventListener("load", refresh);
    const frame = window.requestAnimationFrame(refresh);

    return () => {
      window.cancelAnimationFrame(frame);
      imageElement?.removeEventListener("load", refresh);
      motion.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="collection-closing-section">
      <div className="container-page">
        <div className="collection-closing-banner">
          <img
            className="collection-closing-banner-image"
            src={image}
            alt={alt}
            data-closing-image
            loading="lazy"
            decoding="async"
          />
          <MediaOverlay variant="strong" />
          <div className="collection-closing-banner-copy">
            <div className="collection-closing-banner-title" role="heading" aria-level="2">
              <span><span data-closing-title>{title}</span></span>
            </div>
            <p className="collection-closing-banner-body" data-closing-copy>{body}</p>
            <Link className="collection-closing-banner-link" to={ctaLink} data-closing-copy>
              {ctaText}<span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
