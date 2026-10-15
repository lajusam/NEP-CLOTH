import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { fetchOrderById, formatPrice } from "../lib/api";
import Footer from "../components/Footer";

const STATUS_BADGE_MAP = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  confirmed: "bg-blue-100 text-blue-900 border-blue-300",
  shipped: "bg-purple-100 text-purple-900 border-purple-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  cancelled: "bg-red-100 text-red-900 border-red-300",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewOrder = Boolean(location.state?.isNewOrder);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || "Order not found");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stark-white flex flex-col justify-between">
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-8 h-8 border border-black border-t-transparent animate-spin mb-4" />
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary">
            LOADING ORDER DETAILS...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stark-white flex flex-col justify-between">
        <div className="container-page flex-1 max-w-xl mx-auto w-full py-24 text-center">
          <span className="material-symbols-outlined text-zinc-300 text-7xl mb-4">
            search_off
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-obsidian uppercase tracking-wide mb-3">
            ORDER NOT FOUND
          </h1>
          <p className="font-sans text-[13px] text-secondary leading-relaxed mb-8">
            The requested order could not be located or does not belong to your account.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/orders"
              className="px-8 py-4 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors"
            >
              MY ORDERS
            </Link>
            <Link
              to="/"
              className="px-8 py-4 border border-black text-obsidian font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
            >
              HOME
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBadgeStyle =
    STATUS_BADGE_MAP[order.status.toLowerCase()] || "bg-zinc-100 text-zinc-800 border-zinc-300";

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 max-w-5xl mx-auto w-full py-12 md:py-20">
        {/* Success alert on new order */}
        {isNewOrder && (
          <div className="mb-10 p-6 md:p-8 bg-emerald-50 border border-emerald-300">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-emerald-800 text-4xl flex-shrink-0">
                check_circle
              </span>
              <div>
                <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-emerald-800 font-bold block mb-1">
                  ORDER CONFIRMATION
                </span>
                <h2 className="font-display text-3xl md:text-4xl text-emerald-950 uppercase mb-2">
                  THANK YOU FOR YOUR ORDER
                </h2>
                <p className="font-sans text-[13px] text-emerald-900 leading-relaxed max-w-2xl">
                  Your order <strong>{order.orderNumber}</strong> has been received and confirmed for Cash on Delivery.
                  Our logistics team is preparing your package. Please keep exact cash ready upon arrival.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-black pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary">
                ORDER RECEIPT
              </span>
              <span className={`font-sans text-[10px] uppercase font-bold tracking-widest px-3 py-0.5 border ${statusBadgeStyle}`}>
                {order.status}
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-obsidian uppercase tracking-tight">
              {order.orderNumber}
            </h1>
            <p className="font-sans text-[12px] text-secondary mt-1">
              Placed on {formattedDate}
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              to="/orders"
              className="px-6 py-3 border border-black font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
            >
              ← ALL ORDERS
            </Link>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Purchased Items (Left) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-black p-6 md:p-8">
              <h2 className="font-display text-2xl text-obsidian uppercase tracking-wider mb-6 border-b border-zinc-200 pb-4">
                ITEMS PURCHASED ({order.items?.length || 0})
              </h2>

              <div className="divide-y divide-zinc-200">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex gap-4 sm:gap-6 items-center">
                    <div className="w-20 h-24 bg-zinc-100 border border-zinc-200 flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display text-xs text-zinc-400">
                          NEP
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-[14px] uppercase font-bold text-obsidian">
                        {item.productName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 font-sans text-[11px] uppercase tracking-wider text-secondary">
                        <span>SIZE: {item.size}</span>
                        <span>·</span>
                        <span>COLOR: {item.color}</span>
                        <span>·</span>
                        <span>QTY: {item.quantity}</span>
                      </div>
                      <div className="mt-2 font-sans text-[12px] text-zinc-500">
                        Unit Price: {formatPrice(item.unitPrice)}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-sans text-[14px] text-obsidian font-bold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="border border-black p-6 md:p-8 space-y-4">
              <h2 className="font-display text-2xl text-obsidian uppercase tracking-wider border-b border-zinc-200 pb-4">
                SHIPPING & CONTACT
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-sans text-[13px]">
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    RECIPIENT NAME
                  </span>
                  <p className="font-medium text-obsidian">{order.customerName}</p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    CONTACT NUMBER
                  </span>
                  <p className="font-medium text-obsidian">{order.phone}</p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    DELIVERY ADDRESS
                  </span>
                  <p className="font-medium text-obsidian leading-relaxed">{order.address}</p>
                </div>

                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    CITY / DISTRICT
                  </span>
                  <p className="font-medium text-obsidian">{order.city}</p>
                </div>

                {order.notes && (
                  <div className="sm:col-span-2 bg-zinc-50 p-4 border border-zinc-200">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                      DELIVERY INSTRUCTIONS
                    </span>
                    <p className="text-obsidian italic">&quot;{order.notes}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Total Breakdown (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-black p-6 md:p-8 bg-zinc-50 space-y-6">
              <h3 className="font-display text-2xl text-obsidian uppercase tracking-wider border-b border-zinc-300 pb-4">
                SUMMARY
              </h3>

              <div className="space-y-3 font-sans text-[12px] uppercase tracking-wider">
                <div className="flex justify-between text-secondary">
                  <span>ITEMS SUBTOTAL</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>SHIPPING FEE</span>
                  <span className="text-emerald-700 font-bold">
                    {order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>PAYMENT METHOD</span>
                  <span>CASH ON DELIVERY</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>PAYMENT STATUS</span>
                  <span className="font-bold text-amber-800">
                    {order.paymentStatus.toUpperCase()} (DUE AT DOORSTEP)
                  </span>
                </div>

                <div className="border-t border-black pt-4 mt-4 flex justify-between items-baseline font-display text-3xl text-obsidian uppercase">
                  <span>TOTAL DUE</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <Link
                  to="/"
                  className="block w-full py-4 text-center bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors"
                >
                  CONTINUE SHOPPING
                </Link>
              </div>
            </div>

            <div className="border border-zinc-200 p-6 text-center">
              <span className="material-symbols-outlined text-obsidian text-3xl mb-2">
                verified
              </span>
              <p className="font-sans text-[11px] uppercase tracking-wider text-secondary">
                Authentic Himalayan Crafts · 100% Quality Guaranteed
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
