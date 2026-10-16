import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CursorFollower() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    // Move cursor to follow mouse
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power2.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power2.out" });
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        moveX.tween.pause();
        moveY.tween.pause();
      } else {
        moveX.tween.resume();
        moveY.tween.resume();
      }
    };
    const onMouseMove = (event) => {
      if (document.visibilityState !== "visible") return;
      moveX(event.clientX - 12);
      moveY(event.clientY - 12);
    };

    // Scale up on interactive elements
    const onMouseEnter = () => {
      cursor.style.backgroundColor = "#000";
      gsap.to(cursor, {
        scale: 2.5,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.3,
        ease: "power2.out",
      });
    };

    const onMouseLeave = () => {
      cursor.style.backgroundColor = "transparent";
      gsap.to(cursor, {
        scale: 1,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.3,
        ease: "power2.out",
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const selector = ".product-card, .carousel-card, .drawer-product-card, .category-panel, button, a";
    const onPointerOver = (event) => {
      const target = event.target.closest(selector);
      if (target && !target.contains(event.relatedTarget)) onMouseEnter();
    };
    const onPointerOut = (event) => {
      const target = event.target.closest(selector);
      if (target && !target.contains(event.relatedTarget)) onMouseLeave();
    };
    document.addEventListener("mouseover", onPointerOver, { passive: true });
    document.addEventListener("mouseout", onPointerOut, { passive: true });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("mouseout", onPointerOut);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gsap.killTweensOf(cursor);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        width: "24px",
        height: "24px",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        border: "1px solid #000",
        borderRadius: "50%",
        background: "transparent",
        transform: "translate(-100px, -100px)",
        mixBlendMode: "difference",
      }}
    />
  );
}
