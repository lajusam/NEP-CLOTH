export function RailSkeleton({ count = 4 }) {
  return <div className="storefront-rail storefront-rail-skeleton" aria-label="Loading products" aria-busy="true">
    {Array.from({ length: count }, (_, index) => <div className="storefront-skeleton-card" key={index}>
      <div className="storefront-skeleton-image" /><div className="storefront-skeleton-line" /><div className="storefront-skeleton-line short" />
    </div>)}
  </div>;
}

export function EmptyState({ children = "NO PRODUCTS AVAILABLE" }) {
  return <p className="storefront-state" role="status">{children}</p>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="storefront-state" role="alert">
    <span>{message || "PRODUCTS COULD NOT BE LOADED"}</span>
    <button type="button" className="storefront-outline-button" onClick={onRetry}>RETRY</button>
  </div>;
}
