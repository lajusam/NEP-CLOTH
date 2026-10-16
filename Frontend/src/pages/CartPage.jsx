import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import ResponsiveImage from "../components/ResponsiveImage";
import { formatPrice } from "../lib/api";
import Footer from "../components/Footer";

export default function CartPage() {
  const {
    items,
    totalCount,
    previewSubtotal,
    previewTotal,
    updateQuantity,
    removeItem,
    warnings,
    clearWarnings,
    syncCartWithApi,
    isSyncing,
  } = useCart();

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    syncCartWithApi();
  }, [syncCartWithApi]);

  const hasOutOfStock = items.some((i) => i.isUnavailable || i.stock === 0);

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 max-w-6xl mx-auto w-full py-12 md:py-20">
        {/* Header */}
        <div className="border-b border-black pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary block mb-2">
              BAG REVIEW
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-obsidian uppercase tracking-tight">
              SHOPPING BAG
            </h1>
          </div>
          <span className="font-sans text-[12px] uppercase tracking-[0.2em] text-secondary">
            {totalCount} {totalCount === 1 ? "GARMENT" : "GARMENTS"} SELECTED
          </span>
        </div>

        {/* Syncing indicator */}
        {isSyncing && (
          <div className="mb-6 p-3 bg-zinc-100 border border-zinc-200 flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase tracking-[0.15em] text-secondary">
              VERIFYING LIVE INVENTORY & PRICING...
            </span>
            <div className="w-3.5 h-3.5 border border-black border-t-transparent animate-spin" />
          </div>
        )}

        {/* Warning banner */}
        {warnings.length > 0 && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-5 relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-amber-900 font-bold">
                STOCK OR PRICE ADJUSTMENTS DETECTED:
              </span>
              <button
                onClick={clearWarnings}
                className="text-[11px] uppercase font-sans text-amber-900 hover:text-black tracking-wider cursor-pointer font-bold"
              >
                DISMISS ✕
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 font-sans text-[12px] text-amber-900">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-24 text-center border border-black p-12">
            <span className="material-symbols-outlined text-zinc-300 text-7xl mb-4">
              shopping_bag
            </span>
            <h2 className="font-display text-4xl text-obsidian uppercase tracking-wider mb-3">
              YOUR BAG IS EMPTY
            </h2>
            <p className="font-sans text-[13px] text-secondary max-w-md mx-auto mb-8">
              Explore our contemporary Himalayan outerwear and apparel to select your pieces.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/men"
                className="px-8 py-4 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors"
              >
                SHOP MEN
              </Link>
              <Link
                to="/women"
                className="px-8 py-4 border border-black text-obsidian font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
              >
                SHOP WOMEN
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items List */}
            <div className="lg:col-span-2 divide-y divide-zinc-200 border-t border-b border-black">
              {items.map((item) => {
                const isOutOfStock = item.isUnavailable || item.stock === 0;

                return (
                  <div key={item.variantId} className="py-8 flex flex-col sm:flex-row gap-6">
                    {/* Image */}
                    <div className="w-full sm:w-28 h-40 bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200 relative">
                      {item.image ? (
                        <ResponsiveImage
                          src={item.image}
                          alt={item.name}
                          width={224}
                          height={320}
                          sizes="112px"
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
                        <span className="absolute inset-0 bg-black/60 flex items-center justify-center font-sans text-[10px] uppercase tracking-wider text-white text-center p-2">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <Link
                              to={`/product/${item.slug}`}
                              className="font-display text-2xl text-obsidian uppercase hover:text-altitude-orange transition-colors"
                            >
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-4 mt-1 font-sans text-[11px] uppercase tracking-[0.15em] text-secondary">
                              <span>SIZE: {item.size}</span>
                              <span>·</span>
                              <span>COLOR: {item.color}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="font-sans text-[11px] uppercase tracking-[0.15em] text-secondary hover:text-red-600 transition-colors cursor-pointer"
                          >
                            REMOVE
                          </button>
                        </div>

                        <div className="mt-3 font-sans text-[14px] text-obsidian font-medium">
                          {formatPrice(item.price)}
                        </div>
                      </div>

                      {/* Quantity & line total */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                        <div className="flex items-center border border-black">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isOutOfStock}
                            className="w-8 h-8 flex items-center justify-center font-sans text-sm hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-sans text-[13px] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={
                              isOutOfStock ||
                              (item.stock != null && item.quantity >= item.stock) ||
                              item.quantity >= 10
                            }
                            className="w-8 h-8 flex items-center justify-center font-sans text-sm hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-sans text-[11px] uppercase tracking-wider text-secondary block">
                            LINE TOTAL
                          </span>
                          <span className="font-sans text-[16px] text-obsidian font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <div className="border border-black p-8 bg-zinc-50">
                <h3 className="font-display text-2xl text-obsidian uppercase tracking-wider mb-6 border-b border-zinc-300 pb-4">
                  ORDER SUMMARY
                </h3>

                <div className="space-y-3 font-sans text-[12px] uppercase tracking-wider">
                  <div className="flex justify-between text-secondary">
                    <span>ITEMS SUBTOTAL</span>
                    <span>{formatPrice(previewSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>ESTIMATED DELIVERY</span>
                    <span className="text-emerald-700 font-bold">FREE (COD)</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>PAYMENT METHOD</span>
                    <span>CASH ON DELIVERY</span>
                  </div>
                </div>

                <div className="border-t border-black mt-6 pt-6 flex justify-between items-baseline font-display text-3xl text-obsidian uppercase">
                  <span>PREVIEW TOTAL</span>
                  <span>{formatPrice(previewTotal)}</span>
                </div>

                <p className="font-sans text-[10px] text-zinc-500 uppercase tracking-wider mt-4 leading-relaxed">
                  * Live prices and stock are validated from server records. Final payable amount will be confirmed upon checkout.
                </p>

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={hasOutOfStock}
                  className="w-full mt-8 py-5 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.22em] hover:bg-altitude-orange disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  PROCEED TO CHECKOUT →
                </button>

                {hasOutOfStock && (
                  <p className="font-sans text-[11px] text-red-600 uppercase tracking-wider text-center mt-3">
                    Please remove or update out-of-stock items to continue.
                  </p>
                )}
              </div>

              <div className="border border-zinc-200 p-6 text-center">
                <span className="material-symbols-outlined text-obsidian text-3xl mb-2">
                  local_shipping
                </span>
                <h4 className="font-display text-lg text-obsidian uppercase">
                  NATIONWIDE CASH ON DELIVERY
                </h4>
                <p className="font-sans text-[12px] text-secondary mt-1">
                  Pay securely at your doorstep anywhere in Nepal upon receiving your order.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
