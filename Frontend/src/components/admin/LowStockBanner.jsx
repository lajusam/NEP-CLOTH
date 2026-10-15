import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import gsap from 'gsap';

export default function LowStockBanner({ count = 3, onView }) {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!bannerRef.current || count === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(bannerRef.current,
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, [count]);

  if (count === 0) return null;

  return (
    <div ref={bannerRef} className="admin-alert admin-alert-warning admin-inventory-alert">
      <AlertTriangle size={16} strokeWidth={1} className="text-altitude-orange flex-shrink-0" />
      <span className="font-sans text-[13px]">
        {count} {count === 1 ? 'active product has' : 'active products have'} variants with low stock (1–4 units).
      </span>
      <button
        onClick={onView}
        className="admin-button admin-button-secondary admin-button-sm ml-auto"
      >
        View low stock
      </button>
    </div>
  );
}
