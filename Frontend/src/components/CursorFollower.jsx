import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CursorFollower() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Move cursor to follow mouse
    const onMouseMove = (e) => {
      gsap.to(cursor, {
        x: e.clientX - 12,
        y: e.clientY - 12,
        duration: 0.15,
        ease: "power2.out",
      });
    };

    // Scale up on interactive elements
    const onMouseEnter = () => {
      gsap.to(cursor, {
        scale: 2.5,
        background: "#000",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onMouseLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        background: "transparent",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    document.addEventListener("mousemove", onMouseMove);

    // Attach to product cards, buttons, and links
    const attachInteractive = () => {
      const els = document.querySelectorAll(
        ".product-card, .carousel-card, .drawer-product-card, .category-panel, button, a"
      );
      els.forEach((el) => {
        el.addEventListener("mouseenter", onMouseEnter);
        el.addEventListener("mouseleave", onMouseLeave);
      });
      return els;
    };

    // Use MutationObserver to handle dynamically added elements
    let els = attachInteractive();

    const observer = new MutationObserver(() => {
      // Detach old
      els.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnter);
        el.removeEventListener("mouseleave", onMouseLeave);
      });
      // Reattach
      els = attachInteractive();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      els.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnter);
        el.removeEventListener("mouseleave", onMouseLeave);
      });
      observer.disconnect();
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
