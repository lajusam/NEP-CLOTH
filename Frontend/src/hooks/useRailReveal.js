import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useRailReveal(rootRef, readyKey = "") {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ScrollTrigger.refresh();
      return undefined;
    }

    const ctx = gsap.context(() => {
      root.querySelectorAll("[data-rail-cover]").forEach((cover) => {
        const image = cover.querySelector("img");
        const title = cover.querySelector("[data-cover-title]");
        const button = cover.querySelector("[data-cover-button]");
        if (image) gsap.fromTo(image, { scale: 1.1, clipPath: "inset(8% 8% 8% 8%)" }, {
          scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.out",
          immediateRender: false, scrollTrigger: { trigger: cover, start: "top 80%", once: true },
        });
        if (title) gsap.fromTo(title, { yPercent: 110 }, {
          yPercent: 0, duration: 0.8, ease: "power3.out", immediateRender: false,
          scrollTrigger: { trigger: cover, start: "top 80%", once: true },
        });
        if (button) gsap.fromTo(button, { y: 16, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out", immediateRender: false,
          scrollTrigger: { trigger: cover, start: "top 80%", once: true },
        });
      });

      root.querySelectorAll("[data-rail-heading]").forEach((heading) => {
        const title = heading.querySelector("[data-heading-title]");
        const action = heading.querySelector("[data-heading-action]");
        if (title) gsap.fromTo(title, { yPercent: 110 }, {
          yPercent: 0, duration: 0.75, ease: "power3.out", immediateRender: false,
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
        });
        if (action) gsap.fromTo(action, { y: 12, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, delay: 0.1, immediateRender: false,
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
        });
      });

      root.querySelectorAll("[data-product-rail]").forEach((rail) => {
        const cards = [...rail.querySelectorAll("[data-product-card]")].filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.right > 0 && rect.left < window.innerWidth;
        });
        if (cards.length) gsap.fromTo(cards, { y: 24, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out", immediateRender: false,
          scrollTrigger: { trigger: rail, start: "top 88%", once: true },
        });
      });
    }, root);

    const refreshAfterImage = () => ScrollTrigger.refresh();
    const images = [...root.querySelectorAll("img")];
    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", refreshAfterImage);
        image.addEventListener("error", refreshAfterImage);
      }
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      images.forEach((image) => {
        image.removeEventListener("load", refreshAfterImage);
        image.removeEventListener("error", refreshAfterImage);
      });
      ctx.revert();
    };
  }, [rootRef, readyKey]);
}
