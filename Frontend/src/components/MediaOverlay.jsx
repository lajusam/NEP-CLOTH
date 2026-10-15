const VARIANTS = {
  default: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 50%)",
  strong: "linear-gradient(to top, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0.08) 100%)",
};

export default function MediaOverlay({ variant = "default", className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`media-overlay pointer-events-none absolute inset-0 z-[1] ${className}`}
      style={{ background: VARIANTS[variant] || VARIANTS.default }}
    />
  );
}
