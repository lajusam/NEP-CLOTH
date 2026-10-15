import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, formatPrice } from "../lib/api";
import Footer from "../components/Footer";

const STATUS_BADGE_MAP = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  confirmed: "bg-blue-100 text-blue-900 border-blue-300",
  shipped: "bg-purple-100 text-purple-900 border-purple-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  cancelled: "bg-red-100 text-red-900 border-red-300",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 max-w-6xl mx-auto w-full py-12 md:py-20">
        {/* Header */}
        <div className="border-b border-black pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary block mb-2">
              PURCHASE HISTORY
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-obsidian uppercase tracking-tight">
              MY ORDERS
            </h1>
          </div>
          <Link
            to="/account"
            className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary hover:text-obsidian transition-colors underline"
          >
            ← BACK TO PROFILE
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border border-black border-t-transparent animate-spin mx-auto mb-4" />
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary">
              RETRIEVING ORDER HISTORY...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border-l-4 border-altitude-orange text-center">
            <p className="font-sans text-[13px] text-red-900 uppercase tracking-wider mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-black text-white font-sans text-[11px] uppercase tracking-[0.2em]"
            >
              TRY AGAIN
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center border border-black p-12">
            <span className="material-symbols-outlined text-zinc-300 text-7xl mb-4">
              receipt_long
            </span>
            <h2 className="font-display text-4xl text-obsidian uppercase tracking-wider mb-3">
              NO ORDERS FOUND
            </h2>
            <p className="font-sans text-[13px] text-secondary max-w-md mx-auto mb-8">
              You haven&apos;t placed any orders with us yet. Browse our collections and order with Cash on Delivery.
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
          <div className="space-y-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              const statusBadgeStyle =
                STATUS_BADGE_MAP[order.status.toLowerCase()] || "bg-zinc-100 text-zinc-800 border-zinc-300";

              return (
                <div
                  key={order.id}
                  className="border border-black p-6 md:p-8 hover:shadow-md transition-shadow bg-zinc-50/40"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                      <span className="font-display text-2xl text-obsidian uppercase tracking-wider">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`font-sans text-[10px] uppercase font-bold tracking-widest px-3 py-1 border ${statusBadgeStyle}`}
                      >
                        {order.status}
                      </span>
                      <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 font-sans text-[10px] uppercase tracking-wider">
                        {order.paymentMethod.toUpperCase()} (COD)
                      </span>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="block font-sans text-[11px] uppercase tracking-wider text-secondary">
                        ORDERED ON {formattedDate}
                      </span>
                      <span className="font-display text-2xl text-obsidian">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 overflow-x-auto max-w-xl py-2">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="w-16 h-20 bg-zinc-100 border border-zinc-200 flex-shrink-0 overflow-hidden relative group"
                          title={`${item.productName} (${item.size}/${item.color}) x${item.quantity}`}
                        >
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-display text-xs text-zinc-400">
                              NEP
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 bg-black text-white font-sans text-[9px] px-1 font-bold">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <span className="font-sans text-[11px] text-secondary">
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="px-6 py-3 border border-black font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian hover:bg-black hover:text-white transition-colors whitespace-nowrap self-stretch md:self-auto text-center"
                    >
                      VIEW ORDER DETAILS →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
