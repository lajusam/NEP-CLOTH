import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route wrapper that requires authentication.
 * If user is not logged in, redirects to /login and remembers previous location.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border border-black border-t-transparent animate-spin mb-4" />
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary">
          VERIFYING SESSION...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
