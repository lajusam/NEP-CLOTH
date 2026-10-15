import { Link } from "react-router-dom";
import { getMainImage, getModelImage } from "../../lib/api";
import { formatNPR } from "../../lib/storefrontProducts";
import Badge from "../admin/Badge";
import StarRating from "../reviews/StarRating";

export default function ProductCard({ product }) {
  const image = getMainImage(product);
  const alternate = getModelImage(product);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const outOfStock = variants.length > 0 && variants.every((variant) => Number(variant.stock) <= 0);
  return <article className="storefront-product-card" data-product-card>
    <Link className="storefront-product-link" to={`/product/${product.slug}`} aria-label={`${product.name}, ${formatNPR(product.price)}`}>
      <span className="storefront-product-media">
        {image && <img className="storefront-product-image" src={image} alt={product.name} loading="lazy" decoding="async" />}
        {alternate && <img className="storefront-product-image storefront-product-image-alt" src={alternate} alt="" loading="lazy" decoding="async" />}
        {outOfStock && <span className="storefront-stock-badge"><Badge variant="oos" label="OUT OF STOCK" /></span>}
      </span>
      <span className="storefront-product-name">{product.name}</span>
      {product.reviewCount > 0 && <span className="storefront-product-rating"><StarRating value={product.ratingAverage} count={product.reviewCount} /><span>{Number(product.ratingAverage).toFixed(1)} ({product.reviewCount})</span></span>}
      <span className="storefront-product-price">{formatNPR(product.price)}</span>
    </Link>
  </article>;
}
