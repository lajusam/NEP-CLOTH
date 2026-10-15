import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isForgotView, setIsForgotView] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/account";

  const mapAuthError = (err) => {
    const msg = err?.message || String(err);
    if (msg.includes("Invalid login credentials")) {
      return "Incorrect email or password. Please check your credentials.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Please confirm your email address before logging in.";
    }
    return msg;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!isForgotView && !password) {
      setError("Please enter your password.");
      return;
    }

    if (!isForgotView && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isForgotView) {
        await resetPassword(email);
        setResetSent(true);
      } else {
        await signIn(email, password);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stark-white flex flex-col justify-between">
      <div className="container-page flex-1 flex items-center justify-center py-20">
        <div className="w-full max-w-md border border-black p-8 md:p-12 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-secondary block mb-2">
              NEP CLOTH AUTHENTICATION
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-obsidian tracking-tight uppercase">
              {isForgotView ? "RESET PASSWORD" : "LOG IN"}
            </h1>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 border-l-2 border-altitude-orange bg-red-50/50 p-4">
              <p className="font-sans text-[12px] text-red-700 uppercase tracking-[0.05em] leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Reset Sent Confirmation */}
          {resetSent ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-zinc-50 border border-zinc-200">
                <p className="font-sans text-[13px] text-obsidian leading-relaxed">
                  Password reset link has been dispatched to <strong>{email}</strong>.
                  Please check your inbox.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotView(false);
                  setResetSent(false);
                  setError(null);
                }}
                className="w-full py-4 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors"
              >
                RETURN TO LOG IN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                />
              </div>

              {/* Password (only if not forgot view) */}
              {!isForgotView && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian">
                      PASSWORD *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotView(true);
                        setError(null);
                      }}
                      className="font-sans text-[10px] uppercase tracking-[0.15em] text-secondary hover:text-altitude-orange transition-colors"
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="current-password"
                    required
                    className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.22em] hover:bg-altitude-orange disabled:bg-zinc-400 transition-colors cursor-pointer"
              >
                {loading
                  ? isForgotView
                    ? "DISPATCHING LINK..."
                    : "AUTHENTICATING..."
                  : isForgotView
                  ? "SEND RESET EMAIL"
                  : "SIGN IN"}
              </button>

              {/* Navigation toggle */}
              <div className="pt-4 border-t border-zinc-200 text-center space-y-3">
                {isForgotView ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotView(false);
                      setError(null);
                    }}
                    className="font-sans text-[11px] uppercase tracking-[0.18em] text-secondary hover:text-obsidian transition-colors"
                  >
                    ← BACK TO SIGN IN
                  </button>
                ) : (
                  <p className="font-sans text-[12px] text-secondary">
                    DON&apos;T HAVE AN ACCOUNT?{" "}
                    <Link
                      to="/signup"
                      className="text-obsidian font-bold underline hover:text-altitude-orange transition-colors uppercase tracking-[0.1em]"
                    >
                      CREATE ONE
                    </Link>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
