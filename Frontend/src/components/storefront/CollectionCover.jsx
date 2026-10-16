import { Link } from "react-router-dom";
import MediaOverlay from "../MediaOverlay";
import ResponsiveImage from "../ResponsiveImage";

export default function CollectionCover({ image, title, to, objectPosition = "center" }) {
  if (!image) return null;
  return <Link className="storefront-cover" to={to} data-rail-cover aria-label={`Discover the ${title.toLowerCase()} collection`}>
    <ResponsiveImage src={image} alt="" width={1200} height={800} sizes="(max-width: 768px) 100vw, 50vw" style={{ objectPosition }} />
    <MediaOverlay />
    <div className="storefront-cover-copy">
      <div className="storefront-cover-title-mask"><span data-cover-title>{title}</span></div>
      <span className="storefront-cover-cta" data-cover-button>DISCOVER THE COLLECTION</span>
    </div>
  </Link>;
}
