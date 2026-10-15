import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function WomenHeroBanner() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".model-img",
        { clipPath: "inset(100% 0 0 0)", scale: 1.05 },
        {
          clipPath: "inset(0 0 0 0)",
          scale: 1,
          duration: 1.2,
          ease: "power3.inOut",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#e6e2db]"
    >
      <img
        src="/herosectionimg/womensection.png"
        alt="Women's collection"
        className="model-img absolute inset-0 w-full h-full object-contain"
        style={{ filter: "contrast(1.1) brightness(0.9)" }}
      />
    </section>
  );
}
