import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMAGES } from "../data/images";

gsap.registerPlugin(ScrollTrigger);

const SCROLL_IMAGES = [
  IMAGES.aerialFemale,
  IMAGES.twoModels,
  IMAGES.btsFabric,
  IMAGES.closeUpHands,
];

export default function PinnedEditorial() {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Only pin on desktop (md = 768px+)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: leftRef.current,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-heritage-cream relative flex flex-col md:flex-row"
    >
      {/* Left — text panel (pinned on desktop) */}
      <div
        ref={leftRef}
        className="w-full md:w-1/2 min-h-screen flex flex-col justify-center px-8 md:px-20 py-[120px]"
      >
        <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-6">
          OUR HERITAGE
        </span>
        <h2 className="font-display text-6xl md:text-[clamp(64px,6vw,96px)] text-obsidian uppercase tracking-tighter leading-none mb-10">
          WEAVING<br />IDENTITY<br />INTO EVERY<br />THREAD
        </h2>
        <p className="font-editorial text-[15px] leading-[1.8] text-secondary max-w-sm mb-10">
          Born in Kathmandu, refined through generations of master weavers.
          Every piece from Nep Aesthetic carries the weight of Himalayan
          heritage and the precision of European craft.
        </p>
        <Link
          to="/women"
          className="font-sans text-[10px] text-obsidian uppercase tracking-[0.2em] border-b border-obsidian pb-1 w-max hover:text-altitude-orange hover:border-altitude-orange transition-colors"
        >
          EXPLORE THE STORY →
        </Link>
      </div>

      {/* Right — scrolling images (desktop only) */}
      <div className="hidden md:flex flex-col w-1/2">
        {SCROLL_IMAGES.map((src, i) => (
          <div key={i} className="relative" style={{ height: "100vh" }}>
            <img
              src={src}
              alt={`Heritage ${i + 1}`}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 15%" }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
