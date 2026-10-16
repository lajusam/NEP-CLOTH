import ProductGrid from "./ProductGrid";
import useProducts from "../hooks/useProducts";

export default function CollectionsGrid() {
  const { data = [], isPending: loading, error, refetch } = useProducts({ limit: 50 });
  const products = data.slice(0, 14);

  return (
    <>
      {/* Product carousel replacement */}
      {loading ? (
        <div className="w-full py-[120px] bg-stark-white flex flex-col items-center justify-center">
          <p className="font-display text-[32px] text-black tracking-wider animate-pulse">LOADING NEW ARRIVALS...</p>
        </div>
      ) : error ? (
        <div className="w-full py-[120px] bg-stark-white flex flex-col items-center justify-center gap-4 text-center px-6">
          <h3 className="font-display text-[36px] text-black">UNABLE TO LOAD PRODUCTS</h3>
          <p className="font-sans text-[13px] text-[#666] max-w-md">{error.message || "Failed to load products"}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-8 py-3 bg-black text-white font-sans text-[11px] uppercase tracking-[0.15em] hover:bg-[#333] transition-colors cursor-pointer"
          >
            RETRY
          </button>
        </div>
      ) : (
        <ProductGrid products={products} page="home" />
      )}
    </>
  );
}
