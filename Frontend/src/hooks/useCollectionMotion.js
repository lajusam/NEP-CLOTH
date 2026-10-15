import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const COLLECTION_MOTION = {
  duration: 0.72,
  stagger: 0.075,
  y: 28,
  scale: 0.97,
  ease: "power3.out",
};

export default function useCollectionMotion(scopeRef) {
  useEffect(() => {
    if (!scopeRef.current) return undefined;

    const context = gsap.context(() => {
      const headings = gsap.utils.toArray("h1, h2, h3");
      headings.forEach((heading) => {
        gsap.fromTo(heading, { y: 18, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.72,
          ease: "power4.out",
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
        });
      });

      const collection = scopeRef.current.querySelector(".product-collection-section");
      const cards = collection?.querySelectorAll(".carousel-card");
      if (cards?.length) {
        gsap.fromTo(cards,
          { y: COLLECTION_MOTION.y, autoAlpha: 0, scale: COLLECTION_MOTION.scale },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: COLLECTION_MOTION.duration,
            stagger: COLLECTION_MOTION.stagger,
            ease: COLLECTION_MOTION.ease,
            clearProps: "all",
            scrollTrigger: { trigger: collection, start: "top 82%", once: true },
          }
        );
      }

      const footer = scopeRef.current.querySelector("footer");
      const columns = footer?.querySelectorAll(":scope > div:not([class*='col-span-4'])");
      if (columns?.length) {
        gsap.from(columns, {
          y: 30,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: footer, start: "top 90%", once: true },
        });
      }
    }, scopeRef);

    return () => context.revert();
  }, [scopeRef]);
}
