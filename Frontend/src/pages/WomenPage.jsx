import { useEffect, useRef } from "react";
import ProductGrid from "../components/ProductGrid";
import CollectionClosingBanner from "../components/CollectionClosingBanner";
import { EditorialFeature } from "../components/EditorialPhotoSection";
import Footer from "../components/Footer";
import WomenHero from "../components/WomenHero";
import useCollectionMotion from "../hooks/useCollectionMotion";
import useProducts from "../hooks/useProducts";
import "./CollectionEditorialLayout.css";

export default function WomenPage() {
  const pageRef = useRef(null);
  const { data: products = [], isPending: loading, error, refetch } = useProducts({ section: "women" });

  useCollectionMotion(pageRef);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={pageRef} className="collection-editorial-page collection-editorial-page--women">
      <WomenHero />

      <div id="products">
        {loading ? (
          <div className="collection-state w-full py-[120px] bg-stark-white flex flex-col items-center justify-center">
            <p className="font-display text-[32px] text-black tracking-wider animate-pulse">LOADING WOMEN&apos;S COLLECTION...</p>
          </div>
        ) : error ? (
          <div className="collection-state w-full py-[120px] bg-stark-white flex flex-col items-center justify-center gap-4 text-center px-6">
            <h3 className="font-display text-[36px] text-black">UNABLE TO LOAD PRODUCTS</h3>
            <p className="font-sans text-[13px] text-[#666] max-w-md">{error.message || "Failed to load women's collection"}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-8 py-3 bg-black text-white font-sans text-[11px] uppercase tracking-[0.15em] hover:bg-[#333] transition-colors cursor-pointer"
            >
              RETRY
            </button>
          </div>
        ) : (
          <ProductGrid products={products} page="women" />
        )}
      </div>

      <EditorialFeature
        eyebrow="FORM STUDIES / 01"
        headline={"TAILORED IN\nCONTRAST"}
        body="A precise silhouette meets the imperfect texture of the city: restraint, structure, and a little defiance."
        ctaText="EXPLORE WOMEN"
        ctaLink="/women"
        image={{ src: "/editorial/women/bfe14a2fff3ca1ca0adf0b341b61d0d3.webp", width: 696, height: 1186 }}
        alt="Woman wearing a black tailored look against patterned pavement"
      />

      <EditorialFeature
        eyebrow="CAMPAIGN / 02"
        headline={"COLOR, WITH\nINTENT"}
        body="Burgundy tailoring brings a sharp, expressive note to the collection's architectural line."
        ctaText="VIEW THE COLLECTION"
        ctaLink="/women"
        image={{ src: "/editorial/women/e1d45969d03757b28c271fe12e32c020.webp", width: 736, height: 1041 }}
        alt="Burgundy tailored editorial look"
        reverse
      />

      <CollectionClosingBanner
        image="/mencloth/menside/aa0771966b0d5b5060bf2c658c04b189.jpg"
        alt="Menswear model in a black high-collar jacket and sculptural silver sunglasses"
        title="MEN'S COLLECTION"
        body="Looking for menswear? Explore the men's collection."
        ctaText="EXPLORE MEN'S COLLECTION"
        ctaLink="/men"
      />

      <Footer />
    </div>
  );
}
