import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useCategoryCoverReveal(rootRef, enabled = true) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ScrollTrigger.refresh();
      return undefined;
    }

    const context = gsap.context(() => {
      root.querySelectorAll("[data-category-cover]").forEach((cover) => {
        const image = cover.querySelector("[data-category-cover-image]");
        const title = cover.querySelector("[data-category-cover-title]");
        const cta = cover.querySelector("[data-category-cover-cta]");

        gsap.fromTo(cover,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.1,
            ease: "power3.out",
            immediateRender: false,
            clearProps: "clipPath",
            onStart: () => { cover.style.willChange = "clip-path"; },
            onComplete: () => { cover.style.willChange = ""; },
            scrollTrigger: { trigger: cover, start: "top 80%", once: true },
          }
        );

        if (image) {
          gsap.fromTo(image,
            { scale: 1.25 },
            {
              scale: 1.12,
              duration: 1.4,
              ease: "power3.out",
              immediateRender: false,
              onStart: () => { image.style.willChange = "transform"; },
              onComplete: () => { image.style.willChange = ""; },
              scrollTrigger: { trigger: cover, start: "top 80%", once: true },
            }
          );

        }

        if (title) gsap.fromTo(title, { yPercent: 110 }, {
          yPercent: 0,
          duration: 0.9,
          delay: 0.35,
          ease: "power4.out",
          immediateRender: false,
          clearProps: "transform",
          scrollTrigger: { trigger: cover, start: "top 80%", once: true },
        });

        if (cta) gsap.fromTo(cta, { y: 16, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 1.45,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: cover, start: "top 80%", once: true },
        });
      });
    }, root);

    const media = gsap.matchMedia(root);
    media.add("(min-width: 1024px)", () => {
      root.querySelectorAll("[data-category-cover-image]").forEach((image) => {
        gsap.fromTo(image, { yPercent: -5 }, {
          yPercent: 5,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: image.closest("[data-category-cover]"), start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });
    });

    const refreshAfterImage = () => ScrollTrigger.refresh();
    const images = [...root.querySelectorAll("[data-category-cover-image]")];
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
      media.revert();
      context.revert();
    };
  }, [enabled, rootRef]);
}
