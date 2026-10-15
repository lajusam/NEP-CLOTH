import { useEffect, useRef as useReactRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const useHeroAnimation = (ref) => {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.3,
      });
    });
    return () => ctx.revert();
  }, []);
};

export const useScrollFadeUp = (ref, stagger = 0.15) => {
  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.children;
    if (!children.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        children,
        { y: 60, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 90%",
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger,
        }
      );
    });
    return () => ctx.revert();
  }, []);
};

export const useSlideIn = (ref, direction = "left") => {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { x: direction === "left" ? -80 : 80, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
          },
          x: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power4.out",
        }
      );
    });
    return () => ctx.revert();
  }, []);
};

export const useNavAnimation = (ref) => {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1,
      });
    });
    return () => ctx.revert();
  }, []);
};

export const useParallax = (ref) => {
  useEffect(() => {
    if (!ref.current) return;
    const parent = ref.current.parentElement;
    if (!parent) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: 150,
        ease: "none",
        scrollTrigger: {
          trigger: parent,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);
};

/* ── Admin-specific hooks ─────────────────────────────────────────── */

export const useAdminPageEntry = (ref) => {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power4.out", delay: 0.1 }
      );
    });
    return () => ctx.revert();
  }, []);
};

export const useAdminStagger = (ref, selector, opts = {}) => {
  const { y = 20, x = 0, stagger = 0.04, delay = 0.2, duration = 0.5 } = opts;
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll(selector);
    if (!els.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { y, x, opacity: 0 },
        { y: 0, x: 0, opacity: 1, duration, ease: "power3.out", stagger, delay }
      );
    });
    return () => ctx.revert();
  }, []);
};

export const useAdminSlideIn = (ref, direction = "left") => {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { x: direction === "left" ? -60 : 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power4.out", delay: 0.1 }
      );
    });
    return () => ctx.revert();
  }, []);
};

