import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder, formatPrice } from "../lib/api";
import Footer from "../components/Footer";

const NEPALI_PHONE_REGEX = /^(?:\+977[- ]?)?9[678]\d{8}$/;

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { items, previewSubtotal, previewTotal, clearCart, syncCartWithApi } = useCart();
  const navigate = useNavigate();

  // Prefill name from profile
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Kathmandu");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [stockErrorItem, setStockErrorItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    syncCartWithApi();
  }, [syncCartWithApi]);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    } else if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    }
  }, [profile, user]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setStockErrorItem(null);

    if (items.length === 0) {
      setError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide a valid full name (at least 2 characters).");
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!NEPALI_PHONE_REGEX.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Nepali mobile number (e.g., 98XXXXXXXX or 97XXXXXXXX).");
      return;
    }

    if (!address.trim() || address.trim().length < 3) {
      setError("Please provide a complete street delivery address.");
      return;
    }

    if (!city.trim() || city.trim().length < 2) {
      setError("Please specify your city or district.");
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shipping: {
          name: name.trim(),
          phone: cleanPhone,
          address: address.trim(),
          city: city.trim(),
          notes: notes.trim() || undefined,
        },
      };

      const createdOrder = await createOrder(orderPayload);

      // Order succeeded: clear cart and go to confirmation/order details
      clearCart();
      navigate(`/orders/${createdOrder.id}`, {
        state: { isNewOrder: true, orderNumber: createdOrder.orderNumber },
        replace: true,
      });
    } catch (err) {
      if (err.status === 409 || err.outOfStockItem) {
        setStockErrorItem(err.outOfStockItem);
        setError(
          err.message ||
            "One or more items in your cart became unavailable. Please adjust your cart."
        );
      } else {
        setError(err.message || "Unable to place order. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stark-white flex flex-col justify-between">
        <div className="container-page flex-1 max-w-4xl mx-auto w-full py-24 text-center">
          <span className="material-symbols-outlined text-zinc-300 text-7xl mb-4">
            shopping_bag
          </span>
          <h1 className="font-display text-5xl text-obsidian uppercase tracking-wide mb-3">
            YOUR CART IS EMPTY
          </h1>
          <p className="font-sans text-[13px] text-secondary max-w-md mx-auto mb-8">
            You do not have any garments queued for checkout.
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 max-w-6xl mx-auto w-full py-12 md:py-20">
        {/* Header */}
        <div className="border-b border-black pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary block mb-2">
              FINAL STEP
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-obsidian uppercase tracking-tight">
              CHECKOUT
            </h1>
          </div>
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-altitude-orange font-bold">
            CASH ON DELIVERY (NATIONWIDE)
          </span>
        </div>

        {/* Stock error alert with Back to Cart button */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-altitude-orange">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-sans text-[12px] uppercase font-bold text-red-800 tracking-wider mb-1">
                  ORDER FAILED
                </h3>
                <p className="font-sans text-[13px] text-red-900 leading-relaxed">
                  {error}
                </p>
                {stockErrorItem && (
                  <p className="font-mono text-[11px] text-red-700 mt-2">
                    Available stock for {stockErrorItem.productName} ({stockErrorItem.size}/{stockErrorItem.color}): {stockErrorItem.availableStock}
                  </p>
                )}
              </div>
              <Link
                to="/cart"
                className="px-6 py-3 bg-red-800 text-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-colors whitespace-nowrap"
              >
                RETURN TO CART
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Shipping & Payment details */}
          <div className="lg:col-span-7 space-y-10">
            {/* Delivery address */}
            <div className="border border-black p-8 space-y-6">
              <h2 className="font-display text-2xl text-obsidian uppercase tracking-wider border-b border-zinc-200 pb-4">
                1. DELIVERY INFORMATION
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                    RECIPIENT FULL NAME *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter recipient full name"
                    className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                    NEPALI MOBILE NUMBER *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="e.g. 9841234567 or 98XXXXXXXX"
                    className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  />
                  <span className="font-sans text-[10px] text-secondary mt-1 block">
                    Our courier rider will call this number prior to arrival.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                      CITY / DISTRICT *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="e.g. Kathmandu, Lalitpur, Pokhara"
                      className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                      POSTAL / AREA CODE
                    </label>
                    <input
                      type="text"
                      defaultValue="44600"
                      className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian bg-zinc-50 rounded-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                    STREET ADDRESS & LANDMARK *
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="House number, Ward, Street name, Near Landmark"
                    className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian focus:outline-none focus:ring-1 focus:ring-black rounded-none resize-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                    DELIVERY INSTRUCTIONS / NOTES (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Leave with security guard, call before arriving"
                    className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border border-black p-8 space-y-4">
              <h2 className="font-display text-2xl text-obsidian uppercase tracking-wider border-b border-zinc-200 pb-4">
                2. PAYMENT METHOD
              </h2>

              <div className="p-5 border-2 border-black bg-zinc-50 flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center bg-black">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl text-obsidian uppercase tracking-wide">
                      CASH ON DELIVERY (COD)
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-700 text-white font-sans text-[9px] uppercase tracking-wider font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-secondary mt-1 leading-relaxed">
                    Pay securely in cash directly to our delivery courier upon parcel handover. No card or advance transfer required.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-black p-8 bg-zinc-50 sticky top-28">
              <h3 className="font-display text-2xl text-obsidian uppercase tracking-wider mb-6 border-b border-zinc-300 pb-4">
                ORDER SUMMARY ({items.length})
              </h3>

              {/* Items summary */}
              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-200 pr-2 mb-6">
                {items.map((item) => (
                  <div key={item.variantId} className="py-3 first:pt-0 flex gap-3 items-center">
                    <div className="w-12 h-16 bg-zinc-200 flex-shrink-0 overflow-hidden border border-zinc-300">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover object-top" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[12px] uppercase font-bold text-obsidian truncate">
                        {item.name}
                      </p>
                      <p className="font-sans text-[10px] text-secondary uppercase tracking-wider">
                        {item.size} / {item.color} · QTY: {item.quantity}
                      </p>
                    </div>
                    <span className="font-sans text-[12px] font-bold text-obsidian whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price rows */}
              <div className="space-y-3 font-sans text-[12px] uppercase tracking-wider border-t border-zinc-200 pt-4">
                <div className="flex justify-between text-secondary">
                  <span>PREVIEW SUBTOTAL</span>
                  <span>{formatPrice(previewSubtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>SHIPPING (COD)</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                <div className="border-t border-black pt-4 flex justify-between items-baseline font-display text-3xl text-obsidian uppercase">
                  <span>PAYABLE TOTAL</span>
                  <span>{formatPrice(previewTotal)}</span>
                </div>
              </div>

              {/* CTA button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-8 py-5 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.22em] hover:bg-altitude-orange disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitting ? "PLACING ORDER WITH COD..." : "CONFIRM & PLACE ORDER →"}
              </button>

              <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-center gap-2 text-zinc-500 font-sans text-[10px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Direct Delivery Guarantee across Nepal</span>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
