import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useReviewsReveal(rootRef, refreshKey) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      gsap.set(root.querySelectorAll("[data-review-reveal], [data-review-bar]"), { clearProps: "all" });
      return undefined;
    }

    const context = gsap.context(() => {
      root.querySelectorAll("[data-review-bar]").forEach((bar) => {
        gsap.from(bar, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.65,
          ease: "power2.out",
          immediateRender: false,
          scrollTrigger: { trigger: bar, start: "top 90%", once: true },
        });
      });
      root.querySelectorAll("[data-review-reveal]").forEach((item, index) => {
        gsap.from(item, {
          y: 14,
          opacity: 0,
          duration: 0.5,
          delay: (index % 5) * 0.07,
          ease: "power2.out",
          immediateRender: false,
          scrollTrigger: { trigger: item, start: "top 92%", once: true },
        });
      });
    }, root);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [rootRef, refreshKey]);
}
