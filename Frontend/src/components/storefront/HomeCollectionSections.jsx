import { useMemo, useRef, useState } from "react";
import { Package, ShieldCheck, Truck } from "lucide-react";
import useProducts from "../../hooks/useProducts";
import { STORE_INFO } from "../../config/storeInfo";
import { IMAGES } from "../../data/images";
import { interleaveByCategory } from "../../lib/mixProducts";
import useRailReveal from "../../hooks/useRailReveal";
import useCategoryCoverReveal from "../../hooks/useCategoryCoverReveal";
import CollectionCover from "./CollectionCover";
import CategoryCover from "./CategoryCover";
import SectionHeader from "./SectionHeader";
import ProductRail from "./ProductRail";

const sections = [
  { key: "women", title: "THE WOMEN'S EDIT", filters: { section: "women", limit: 50 }, to: "/women", action: "DISCOVER MORE", label: "Women's collection", mixCategories: true },
  { key: "men", title: "THE MEN'S EDIT", filters: { section: "men", limit: 50 }, to: "/men", action: "DISCOVER MORE", label: "Men's collection", mixCategories: true },
];

const accessorySections = [
  { key: "caps", title: "CAPS", filters: { category: "caps", limit: 12 }, label: "Caps", className: "storefront-accessories", targetId: "home-caps-heading", cover: { image: "/caps/capcover.jpg", srcSet: "/caps/capcover-640.webp 640w, /caps/capcover-1280.webp 1280w, /caps/capcover-1920.webp 1920w", width: 608, height: 608, objectPosition: "center 14%" } },
  { key: "bags", title: "BAGS", filters: { category: "bags", limit: 12 }, label: "Bags", className: "storefront-accessories", targetId: "home-bags-heading", cover: { image: "/womencloth/Bags/bagcover.jpg", srcSet: "/womencloth/Bags/bagcover-640.webp 640w, /womencloth/Bags/bagcover-1280.webp 1280w, /womencloth/Bags/bagcover-1920.webp 1920w", width: 1200, height: 1680, objectPosition: "center 22%" } },
];

const HOME_PRODUCTS_FILTERS = { limit: 50 };

function useProductQuery(filters) {
  const query = useProducts(HOME_PRODUCTS_FILTERS);
  const allProducts = query.data || [];
  const products = filters.section
    ? allProducts.filter((product) => product.section === filters.section)
    : filters.category
      ? allProducts.filter((product) => product.category === filters.category)
      : allProducts;
  return { products: products.slice(0, filters.section ? 50 : filters.category ? 12 : 14), loading: query.isPending, error: query.error?.message || "", retry: query.refetch };
}

function ProductSection({ config, cover }) {
  const filters = config.filters;
  const result = useProductQuery(filters);
  const [mixSeed] = useState(() => Math.random());
  const rootRef = useRef(null);
  const hasCategoryCover = Boolean(config.cover);
  const displayProducts = useMemo(() => {
    const ordered = config.mixCategories ? interleaveByCategory(result.products, mixSeed) : result.products;
    return config.mixCategories ? ordered.slice(0, 8) : ordered;
  }, [config.mixCategories, mixSeed, result.products]);
  const readyKey = `${result.loading}:${displayProducts.map((product) => product.id || product.slug).join(",")}`;
  useRailReveal(rootRef, readyKey);
  useCategoryCoverReveal(rootRef, hasCategoryCover);
  const hasProducts = result.loading || Boolean(result.error) || result.products.length > 0;
  return <section className={`storefront-section${config.className ? ` ${config.className}` : ""}`} ref={rootRef} aria-labelledby={`home-${config.key}-heading`} id={config.key === "caps" || config.key === "bags" ? `${config.key}-products` : undefined}>
    {config.cover && <div className="storefront-cover-wrap"><CategoryCover {...config.cover} title={config.title} ariaLabel={`Shop ${config.label.toLowerCase()}`} targetId={config.targetId} hasProducts={hasProducts} /></div>}
    {cover && <div className="storefront-cover-wrap"><CollectionCover {...cover} /></div>}
    <SectionHeader id={`home-${config.key}-heading`} title={config.title} action={config.action} to={config.to} />
    <ProductRail products={displayProducts} loading={result.loading} error={result.error} onRetry={result.retry} label={config.label} emptyText={config.cover ? "NEW PIECES COMING SOON" : undefined} />
  </section>;
}

export function HomeTrustStrip() {
  const icons = { package: Package, truck: Truck, shield: ShieldCheck };
  const items = STORE_INFO.trustItems.filter((item) => item.text.trim());
  if (!items.length) return null;
  return <section className="storefront-trust container-page" aria-label="Store information">
    {items.map((item) => {
      const Icon = icons[item.icon] || Package;
      return <div className="storefront-trust-item" key={`${item.icon}-${item.text}`}><Icon size={19} strokeWidth={1.5} aria-hidden="true" /><span>{item.text}</span></div>;
    })}
  </section>;
}

export function HomeAccessorySections() {
  return <div className="storefront-home-accessories">
    <ProductSection config={accessorySections[0]} />
    <ProductSection config={accessorySections[1]} />
  </div>;
}

export default function HomeCollectionSections() {
  return <div className="storefront-home-sections">
    <ProductSection config={sections[0]} cover={{ image: IMAGES.womenSide3, title: "WOMEN", to: "/women", objectPosition: "center 15%" }} />
    <ProductSection config={sections[1]} cover={{ image: "/mencloth/menside/56af69813fa9f9e5fe24af2edcb21709.jpg", title: "MEN", to: "/men", objectPosition: "center 38%" }} />
  </div>;
}
