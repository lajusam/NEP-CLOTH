import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollHero from "../components/ScrollHero";
import MarqueeStrip from "../components/MarqueeStrip";
import CollectionsGrid from "../components/CollectionsGrid";
import Footer from "../components/Footer";
import HomeCollectionSections, { HomeAccessorySections } from "../components/storefront/HomeCollectionSections";
import "../components/storefront/storefront.css";

export default function HomePage() {
  const marqueeTimelineRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // ── Hero bg image parallax — scrub ────────────────────────────────
      const heroOuter = document.getElementById("scroll-hero-outer");
      if (heroOuter) {
        const heroImg = heroOuter.querySelector(".hero-model-img");
        if (heroImg) {
          heroImg.style.willChange = "transform";
          gsap.to(heroImg, {
            y: 150,
            ease: "none",
            scrollTrigger: {
              trigger: heroOuter,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      }

      // ── 4. Marquee strip — on scroll + velocity-based speed ──────────────
      const marqueeWrap = document.querySelector(".marquee-text")?.parentElement;
      if (marqueeWrap) {
        marqueeWrap.style.willChange = "opacity";
        gsap.from(marqueeWrap, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: marqueeWrap,
            start: "top 90%",
            once: true,
          },
        });

        const marqueeEl = document.querySelector(".marquee-text");
        if (marqueeEl) {
          const marqueeTl = gsap.timeline({ repeat: -1 });
          marqueeEl.style.animation = "none";
          const totalWidth = marqueeEl.scrollWidth / 2;
          marqueeTl.fromTo(
            marqueeEl,
            { x: 0 },
            { x: -totalWidth, duration: 25, ease: "none" }
          );
          marqueeTimelineRef.current = marqueeTl;

          ScrollTrigger.create({
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              const velocity = Math.abs(self.getVelocity());
              const newTimeScale = Math.min(Math.max(velocity / 300, 1), 6);
              gsap.to(marqueeTl, { timeScale: newTimeScale, duration: 0.1, overwrite: true });
              gsap.to(marqueeTl, { timeScale: 1, duration: 0.8, delay: 0.2, overwrite: "auto" });
            },
          });
        }
      }

      // ── 6. Text reveal on all section headings ───────────────────────────
      const allHeadings = document.querySelectorAll("h2, h3");
      allHeadings.forEach((heading) => {
        if (heading.closest('#scroll-hero-outer')) return;
        if (heading.dataset.revealed) return;
        heading.dataset.revealed = "true";

        const text = heading.innerHTML;
        heading.innerHTML = `<span style="display:block;overflow:hidden"><span class="heading-reveal-inner" style="display:block;transform:translateY(100%)">${text}</span></span>`;
        const inner = heading.querySelector(".heading-reveal-inner");
        if (inner) {
          gsap.to(inner, {
            y: "0%",
            duration: 0.9,
            ease: "power4.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
              once: true,
            },
          });
        }
      });

      // ── 7. (Removed) ─────────────────────────────────────────────────────
      // Product card entrance is handled by ProductGrid's own useLayoutEffect.
      // A duplicate gsap.from() here caused cards to get stuck at opacity: 0.

      // ── 8. Editorial body & CTA stagger ──────────────────────────────────
      const editorialSection = document.querySelector(
        'section[class*="border-y"][class*="grid-cols-2"]'
      );
      if (editorialSection) {
        const textCol = editorialSection.querySelector('div[class*="bg-stark-white"]');
        const editItems = [textCol?.querySelector("p"), textCol?.querySelector("a")].filter(Boolean);
        if (editItems.length) {
          editItems.forEach((el) => {
            el.style.willChange = "transform, opacity";
          });
          gsap.from(editItems, {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.15,
            delay: 1.1,
            scrollTrigger: {
              trigger: editorialSection,
              start: "top 85%",
              once: true,
            },
          });
        }
      }

      // ── 9. Footer columns ────────────────────────────────────────────────
      const footer = document.querySelector("footer");
      if (footer) {
        const footerCols = Array.from(
          footer.querySelectorAll(":scope > .footer-inner > div:not([class*='col-span-4'])")
        );
        if (footerCols.length) {
          footerCols.forEach((col) => {
            col.style.willChange = "transform, opacity";
          });
          gsap.from(footerCols, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: footer,
              start: "top 90%",
              once: true,
            },
          });
        }
      }

      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <ScrollHero />

      <MarqueeStrip />

      <CollectionsGrid />

      <HomeCollectionSections />

      <HomeAccessorySections />

      {/* Newsletter */}
      <section className="bg-heritage-cream py-[120px] border-b border-obsidian">
        <div className="container-page">
          <div className="max-w-xl mx-auto text-center">
            <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em]">
              THE ALTITUDE JOURNAL
            </span>
            <h3 className="font-display text-4xl md:text-6xl text-obsidian tracking-tight mt-4 mb-6">
              STAY ELEVATED
            </h3>
            <p className="font-editorial text-[15px] leading-[1.8] text-secondary mb-8">
              Subscribe for access to exclusive editorials, early collection releases, and events from
              Kathmandu to the world.
            </p>
            <form
              className="flex border border-obsidian"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="YOUR EMAIL ADDRESS"
                className="flex-1 px-4 py-3 font-sans text-[12px] uppercase tracking-[0.15em] bg-transparent outline-none placeholder:text-secondary border-none"
              />
              <button
                type="submit"
                className="bg-obsidian text-stark-white font-sans text-[10px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-altitude-orange transition-colors"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
