import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// NOTE: This client-side AdminRoute is only a UI navigation guard.
// Real security, data protection, and authorization are strictly enforced
// on the server by the backend requireAdmin middleware.

/**
 * Route guard that requires active session and verified "admin" role
 * fetched securely from backend GET /auth/me.
 */
export default function AdminRoute({ children }) {
  const { user, role, isAdmin, loading } = useAuth();
  const location = useLocation();

  // 1. Loading state — avoids any flash of admin portal
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stark-white">
        <div className="w-8 h-8 border border-black border-t-transparent animate-spin mb-4" />
        <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary">
          VERIFYING AUTHORIZATION...
        </p>
      </div>
    );
  }

  // 2. Logged out — redirect to login and preserve intended URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged in but not admin — show access denied in project design style
  if (!isAdmin || role !== "admin") {
    return (
      <div className="min-h-screen bg-stark-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md border border-black p-8 md:p-12 text-center shadow-sm">
          <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-altitude-orange block mb-2 font-medium">
            SECURITY RESTRICTION
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-obsidian tracking-tight uppercase mb-4">
            ACCESS DENIED
          </h1>
          <p className="font-sans text-[13px] text-secondary leading-relaxed mb-8">
            This portal is restricted to system administrators. Your account does not have permission to access administrative tools.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="w-full py-4 bg-obsidian text-stark-white font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors text-center"
            >
              RETURN TO STOREFRONT
            </Link>
            <Link
              to="/account"
              className="w-full py-4 border border-black text-obsidian font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors text-center"
            >
              MY ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Admin authorized — render page
  return children;
}
