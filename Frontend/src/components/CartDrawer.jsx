import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/api";

export default function CartDrawer() {
  const {
    items,
    totalCount,
    previewSubtotal,
    previewTotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    warnings,
    clearWarnings,
    isSyncing,
  } = useCart();

  const drawerRef = useRef(null);
  const backdropRef = useRef(null);
  const navigate = useNavigate();

  // GSAP animation for slide-in / slide-out
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      if (backdropRef.current && drawerRef.current) {
        gsap.to(backdropRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(
          drawerRef.current,
          { x: "100%" },
          { x: "0%", duration: 0.4, ease: "power3.out" }
        );
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 transition-opacity"
        style={{ opacity: 0 }}
      />

      {/* Slide-out drawer */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-md bg-stark-white h-full flex flex-col z-10 shadow-2xl border-l border-black overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-black">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-secondary block">
              YOUR SELECTION
            </span>
            <h2 className="font-display text-2xl text-obsidian uppercase tracking-wider">
              SHOPPING BAG ({totalCount})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian hover:text-altitude-orange transition-colors p-2 cursor-pointer"
            aria-label="Close cart"
          >
            CLOSE ✕
          </button>
        </div>

        {/* Syncing indicator */}
        {isSyncing && (
          <div className="bg-zinc-100 px-6 py-2 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-secondary">
              VERIFYING LIVE STOCK & PRICES...
            </span>
            <div className="w-3 h-3 border border-black border-t-transparent animate-spin" />
          </div>
        )}

        {/* Price/Stock Warning Banner */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-300 p-4 relative">
            <div className="flex justify-between items-start">
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-amber-900 font-bold block mb-1">
                ATTENTION:
              </span>
              <button
                onClick={clearWarnings}
                className="text-[10px] uppercase font-sans text-amber-800 hover:text-black tracking-wider cursor-pointer"
              >
                DISMISS ✕
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 font-sans text-[11px] text-amber-900">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-zinc-200">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <span className="material-symbols-outlined text-zinc-300 text-6xl mb-4">
                shopping_bag
              </span>
              <p className="font-display text-3xl text-obsidian uppercase tracking-wider mb-2">
                BAG IS EMPTY
              </p>
              <p className="font-sans text-[13px] text-secondary max-w-xs mb-8">
                You have not added any garments to your bag yet.
              </p>
              <button
                onClick={closeCart}
                className="px-8 py-4 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors cursor-pointer"
              >
                EXPLORE COLLECTION
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isOutOfStock = item.isUnavailable || item.stock === 0;

              return (
                <div key={item.variantId} className="py-6 first:pt-0 last:pb-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-28 bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover object-top ${
                          isOutOfStock ? "grayscale opacity-50" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-zinc-400">
                        NEP
                      </div>
                    )}
                    {isOutOfStock && (
                      <span className="absolute inset-0 bg-black/60 flex items-center justify-center font-sans text-[9px] uppercase tracking-wider text-white text-center p-1">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-sans text-[13px] uppercase font-bold text-obsidian leading-snug">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="font-sans text-[10px] uppercase tracking-[0.15em] text-secondary hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mt-1 font-sans text-[11px] uppercase tracking-wider text-secondary">
                        <span>SIZE: {item.size}</span>
                        <span>·</span>
                        <span>COLOR: {item.color}</span>
                      </div>

                      <div className="mt-2 font-sans text-[13px] text-obsidian font-medium">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {/* Quantity controls & item total */}
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-zinc-100">
                      <div className="flex items-center border border-black">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isOutOfStock}
                          className="w-7 h-7 flex items-center justify-center font-sans text-sm hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-sans text-[12px] font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={
                            isOutOfStock ||
                            (item.stock != null && item.quantity >= item.stock) ||
                            item.quantity >= 10
                          }
                          className="w-7 h-7 flex items-center justify-center font-sans text-sm hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-sans text-[12px] text-obsidian font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="p-6 border-t border-black bg-zinc-50 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between font-sans text-[11px] uppercase tracking-wider text-secondary">
                <span>SUBTOTAL PREVIEW</span>
                <span>{formatPrice(previewSubtotal)}</span>
              </div>
              <div className="flex justify-between font-sans text-[11px] uppercase tracking-wider text-secondary">
                <span>STANDARD SHIPPING</span>
                <span className="text-emerald-700 font-bold">FREE (COD)</span>
              </div>
              <div className="flex justify-between font-display text-2xl text-obsidian uppercase tracking-wider pt-2 border-t border-zinc-200">
                <span>ESTIMATED TOTAL</span>
                <span>{formatPrice(previewTotal)}</span>
              </div>
            </div>

            <p className="font-sans text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">
              * Cart prices and stock are previewed live. Final order total is validated and confirmed securely by the server at checkout.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleCheckoutClick}
                disabled={items.some((i) => i.isUnavailable || i.stock === 0)}
                className="w-full py-4 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.22em] hover:bg-altitude-orange disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                PROCEED TO CHECKOUT →
              </button>
              <Link
                to="/cart"
                onClick={closeCart}
                className="text-center py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-secondary hover:text-obsidian transition-colors underline"
              >
                VIEW FULL CART PAGE
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
