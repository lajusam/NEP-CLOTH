import { Link } from "react-router-dom";
import MediaOverlay from "../MediaOverlay";

export default function CollectionCover({ image, title, to, objectPosition = "center" }) {
  if (!image) return null;
  return <Link className="storefront-cover" to={to} data-rail-cover aria-label={`Discover the ${title.toLowerCase()} collection`}>
    <img src={image} alt="" loading="lazy" decoding="async" style={{ objectPosition }} />
    <MediaOverlay />
    <div className="storefront-cover-copy">
      <div className="storefront-cover-title-mask"><span data-cover-title>{title}</span></div>
      <span className="storefront-cover-cta" data-cover-button>DISCOVER THE COLLECTION</span>
    </div>
  </Link>;
}
