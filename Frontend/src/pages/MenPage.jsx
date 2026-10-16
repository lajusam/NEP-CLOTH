import { useEffect, useRef } from "react";
import MenHero from "../components/MenHero";
import ProductGrid from "../components/ProductGrid";
import { EditorialFeature, EditorialLookbook } from "../components/EditorialPhotoSection";
import CollectionClosingBanner from "../components/CollectionClosingBanner";
import Footer from "../components/Footer";
import useCollectionMotion from "../hooks/useCollectionMotion";
import useProducts from "../hooks/useProducts";
import "./CollectionEditorialLayout.css";

export default function MenPage() {
  const pageRef = useRef(null);
  const { data: products = [], isPending: loading, error, refetch } = useProducts({ section: "men" });

  useCollectionMotion(pageRef);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={pageRef} className="collection-editorial-page collection-editorial-page--men">
      <MenHero />

      <div id="products">
        {loading ? (
          <div className="collection-state w-full py-[120px] bg-stark-white flex flex-col items-center justify-center">
            <p className="font-display text-[32px] text-black tracking-wider animate-pulse">LOADING MEN&apos;S COLLECTION...</p>
          </div>
        ) : error ? (
          <div className="collection-state w-full py-[120px] bg-stark-white flex flex-col items-center justify-center gap-4 text-center px-6">
            <h3 className="font-display text-[36px] text-black">UNABLE TO LOAD PRODUCTS</h3>
            <p className="font-sans text-[13px] text-[#666] max-w-md">{error.message || "Failed to load men's collection"}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-8 py-3 bg-black text-white font-sans text-[11px] uppercase tracking-[0.15em] hover:bg-[#333] transition-colors cursor-pointer"
            >
              RETRY
            </button>
          </div>
        ) : (
          <ProductGrid products={products} page="men" />
        )}
      </div>

      <EditorialFeature
        eyebrow="FIELD NOTES / 01"
        headline="UTILITY, RECAST"
        body="A study in high-altitude layering, graphic denim, and the movement of a modern mountain uniform."
        ctaText="EXPLORE MEN"
        ctaLink="/men"
        image={{ src: "/editorial/men/56af69813fa9f9e5fe24af2edcb21709.webp", width: 800, height: 1199 }}
        alt="Model wearing a blue graphic denim jacket"
      />

      <EditorialLookbook
        eyebrow="FORM STUDIES / 02"
        headline={"LAYERED FOR\nTHE ELEMENTS"}
        images={[
          { src: "/editorial/men/8decc81ff4f1f962b1e3ec531f88dcd8.webp", width: 800, height: 1178, alt: "Model in a black and cream technical jacket", caption: "01 / TECHNICAL KNIT" },
          { src: "/editorial/men/dfda7a099c575897bf70bf74dda2446d.webp", width: 736, height: 920, alt: "Model in a black hooded outer layer", caption: "02 / WEATHER SHELL" },
        ]}
      />

      <CollectionClosingBanner
        image="/womencloth/womenside/aa0771966b0d5b5060bf2c658c04b189.jpg"
        alt="Womenswear model in a black leather jacket and sunglasses against a teal backdrop"
        title="WOMEN'S COLLECTION"
        body="Looking for womenswear? Explore the women's collection."
        ctaText="EXPLORE WOMEN'S COLLECTION"
        ctaLink="/women"
      />

      <Footer />
    </div>
  );
}
