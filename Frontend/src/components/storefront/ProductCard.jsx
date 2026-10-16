import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProductBySlug, getMainImage, getModelImage } from "../../lib/api";
import { formatNPR } from "../../lib/storefrontProducts";
import Badge from "../admin/Badge";
import StarRating from "../reviews/StarRating";
import ResponsiveImage from "../ResponsiveImage";

export default function ProductCard({ product }) {
  const queryClient = useQueryClient();
  const image = getMainImage(product);
  const alternate = getModelImage(product);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const outOfStock = variants.length > 0 && variants.every((variant) => Number(variant.stock) <= 0);
  const prefetchProduct = () => {
    if (!product.slug) return;
    void queryClient.prefetchQuery({
      queryKey: ["product", product.slug],
      queryFn: ({ signal }) => fetchProductBySlug(product.slug, { signal }),
      staleTime: 60_000,
    });
  };
  return <article className="storefront-product-card" data-product-card>
    <Link className="storefront-product-link" to={`/product/${product.slug}`} aria-label={`${product.name}, ${formatNPR(product.price)}`} onMouseEnter={prefetchProduct} onFocus={prefetchProduct}>
      <span className="storefront-product-media">
        {image && <ResponsiveImage className="storefront-product-image" src={image} alt={product.name} width={800} height={1000} sizes="(max-width: 640px) 72vw, (max-width: 1024px) 36vw, 24vw" />}
        {alternate && <ResponsiveImage className="storefront-product-image storefront-product-image-alt" src={alternate} alt="" width={800} height={1000} sizes="(max-width: 640px) 72vw, (max-width: 1024px) 36vw, 24vw" />}
        {outOfStock && <span className="storefront-stock-badge"><Badge variant="oos" label="OUT OF STOCK" /></span>}
      </span>
      <span className="storefront-product-name">{product.name}</span>
      {product.reviewCount > 0 && <span className="storefront-product-rating"><StarRating value={product.ratingAverage} count={product.reviewCount} /><span>{Number(product.ratingAverage).toFixed(1)} ({product.reviewCount})</span></span>}
      <span className="storefront-product-price">{formatNPR(product.price)}</span>
    </Link>
  </article>;
}
