import { Link } from "react-router-dom";

export default function SectionHeader({ title, action = "VIEW ALL", to, id }) {
  return <div className="storefront-heading" data-rail-heading>
    <div className="storefront-heading-mask"><h2 id={id} className="storefront-heading-title" data-heading-title data-revealed="true">{title}</h2></div>
    {to && <Link className="storefront-outline-button" to={to} data-heading-action>{action}</Link>}
  </div>;
}
