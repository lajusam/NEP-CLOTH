import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useEditorialReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const context = gsap.context(() => {
      const eyebrow = root.querySelectorAll("[data-editorial-eyebrow]");
      const headlines = root.querySelectorAll("[data-editorial-headline-line]");
      const paragraphs = root.querySelectorAll("[data-editorial-paragraph]");
      const links = root.querySelectorAll("[data-editorial-link]");
      const underlines = root.querySelectorAll("[data-editorial-underline]");
      const photos = root.querySelectorAll("[data-editorial-photo]");
      const images = root.querySelectorAll("[data-editorial-image]");

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 75%", once: true },
      });

      if (eyebrow.length) {
        timeline.fromTo(eyebrow, { autoAlpha: 0, y: 12 }, {
          autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false,
        });
      }
      if (headlines.length) {
        timeline.fromTo(headlines, { yPercent: 105 }, {
          yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", immediateRender: false,
        }, eyebrow.length ? "-=0.2" : 0);
      }
      if (paragraphs.length) {
        timeline.fromTo(paragraphs, { autoAlpha: 0, y: 24 }, {
          autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", immediateRender: false,
        }, ">+=0.15");
      }
      if (links.length) {
        timeline.fromTo(links, { autoAlpha: 0, y: 16 }, {
          autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false,
        }, ">-0.1");
      }
      if (underlines.length) {
        timeline.fromTo(underlines, { scaleX: 0, transformOrigin: "left center" }, {
          scaleX: 1, duration: 0.6, ease: "power2.out", immediateRender: false,
        }, ">-0.05");
      }
      if (photos.length) {
        timeline.fromTo(photos, { clipPath: "inset(0 0 100% 0)" }, {
          clipPath: "inset(0 0 0% 0)", duration: 1.1, stagger: 0.12,
          ease: "power3.out", immediateRender: false,
        }, 0);
      }
      if (images.length) {
        timeline.fromTo(images, { scale: 1.15 }, {
          scale: 1, duration: 1.1, stagger: 0.12, ease: "power3.out", immediateRender: false,
        }, 0);
      }
    }, root);

    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const images = root.querySelectorAll("[data-editorial-parallax]");
      if (!images.length) return undefined;
      gsap.fromTo(images, { yPercent: -5 }, {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
      });
      return undefined;
    });

    const refresh = () => ScrollTrigger.refresh();
    const pendingImages = Array.from(root.querySelectorAll("img")).filter((image) => !image.complete);
    pendingImages.forEach((image) => image.addEventListener("load", refresh));
    const frame = window.requestAnimationFrame(refresh);

    return () => {
      window.cancelAnimationFrame(frame);
      pendingImages.forEach((image) => image.removeEventListener("load", refresh));
      media.revert();
      context.revert();
    };
  }, [rootRef]);
}
