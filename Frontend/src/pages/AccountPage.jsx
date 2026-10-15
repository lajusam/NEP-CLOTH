import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMe } from "../lib/api";
import Footer from "../components/Footer";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMe();
        if (active) {
          setProfile(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load account profile");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (user) {
      loadProfile();
    }

    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Customer";

  const displayEmail = profile?.email || user?.email || "—";
  const displayRole = profile?.role || "customer";

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 max-w-4xl mx-auto w-full py-16 md:py-24">
        {/* Page Header */}
        <div className="border-b border-black pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary block mb-2">
              CLIENT PROFILE
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-obsidian uppercase tracking-tight">
              MY ACCOUNT
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="self-start md:self-end px-6 py-3 border border-black font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            LOG OUT
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Account Info */}
          <div className="md:col-span-2 border border-black p-8 space-y-8">
            <h2 className="font-display text-2xl text-obsidian uppercase tracking-wide border-b border-zinc-200 pb-4">
              PERSONAL DETAILS
            </h2>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border border-black border-t-transparent animate-spin mx-auto mb-3" />
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary">
                  SYNCHRONIZING PROFILE...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border-l-2 border-altitude-orange">
                <p className="font-sans text-[12px] text-red-700 uppercase tracking-[0.05em]">
                  {error}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    FULL NAME
                  </span>
                  <p className="font-sans text-[16px] text-obsidian font-medium">
                    {displayName}
                  </p>
                </div>

                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    EMAIL ADDRESS
                  </span>
                  <p className="font-sans text-[16px] text-obsidian font-medium break-all">
                    {displayEmail}
                  </p>
                </div>

                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    MEMBERSHIP ROLE
                  </span>
                  <span
                    className={`inline-block px-3 py-1 text-[11px] font-sans uppercase tracking-[0.15em] border ${
                      displayRole === "admin"
                        ? "bg-black text-white border-black font-bold"
                        : "bg-zinc-100 text-obsidian border-zinc-300"
                    }`}
                  >
                    {displayRole}
                  </span>
                </div>

                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
                    ACCOUNT ID
                  </span>
                  <p className="font-mono text-[11px] text-zinc-500 truncate">
                    {profile?.id || user?.id || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions / Editorial Sidebar */}
          <div className="space-y-6">
            <div className="border border-black p-6 bg-zinc-50">
              <h3 className="font-display text-xl text-obsidian uppercase mb-2">
                MY REVIEWS
              </h3>
              <p className="font-sans text-[12px] text-secondary leading-relaxed mb-6">
                Revisit and manage your verified product reviews.
              </p>
              <Link
                to="/account/reviews"
                className="block text-center py-3 border border-black font-sans text-[11px] uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
              >
                VIEW MY REVIEWS →
              </Link>
            </div>

            <div className="border border-black p-6 bg-zinc-50">
              <h3 className="font-display text-xl text-obsidian uppercase mb-2">
                ORDER HISTORY
              </h3>
              <p className="font-sans text-[12px] text-secondary leading-relaxed mb-6">
                Track current Cash on Delivery shipments and view past receipts.
              </p>
              <Link
                to="/orders"
                className="block text-center py-3 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.18em] hover:bg-altitude-orange transition-colors font-medium"
              >
                VIEW MY ORDERS →
              </Link>
            </div>

            <div className="border border-black p-6 bg-zinc-50">
              <h3 className="font-display text-xl text-obsidian uppercase mb-2">
                COLLECTIONS
              </h3>
              <p className="font-sans text-[12px] text-secondary leading-relaxed mb-6">
                Explore the latest SS 2026 arrivals crafted with heritage Himalayan textiles.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/men"
                  className="block text-center py-3 border border-black font-sans text-[11px] uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
                >
                  SHOP MEN
                </Link>
                <Link
                  to="/women"
                  className="block text-center py-3 border border-black font-sans text-[11px] uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
                >
                  SHOP WOMEN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
