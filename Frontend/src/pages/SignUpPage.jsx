import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signedUpSuccess, setSignedUpSuccess] = useState(false);

  const mapSignUpError = (err) => {
    const msg = err?.message || String(err);
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return "An account with this email already exists. Please log in instead.";
    }
    if (msg.includes("weak_password") || msg.includes("Password should be")) {
      return "Password is too weak. Please use at least 8 characters with letters and numbers.";
    }
    return msg;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Role is never passed or allowed from client
      const data = await signUp(email, password, name);

      // If Supabase has email confirmation enabled, session will be null
      if (data?.session) {
        navigate("/account", { replace: true });
      } else {
        setSignedUpSuccess(true);
      }
    } catch (err) {
      setError(mapSignUpError(err));
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
              NEP CLOTH REGISTRATION
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-obsidian tracking-tight uppercase">
              CREATE ACCOUNT
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

          {/* Success / Email confirmation prompt */}
          {signedUpSuccess ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-zinc-50 border border-zinc-200">
                <h3 className="font-display text-2xl text-obsidian uppercase mb-2">
                  CONFIRMATION EMAIL DISPATCHED
                </h3>
                <p className="font-sans text-[13px] text-secondary leading-relaxed">
                  We have sent a verification email to <strong>{email}</strong>.
                  Please click the link in that email to activate your account.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full py-4 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.2em] hover:bg-altitude-orange transition-colors text-center"
              >
                PROCEED TO LOG IN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                />
              </div>

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

              {/* Password */}
              <div>
                <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                  PASSWORD *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian mb-2">
                  CONFIRM PASSWORD *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className="w-full border border-black px-4 py-3 font-sans text-[14px] text-obsidian placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.22em] hover:bg-altitude-orange disabled:bg-zinc-400 transition-colors cursor-pointer mt-2"
              >
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>

              {/* Login link */}
              <div className="pt-4 border-t border-zinc-200 text-center">
                <p className="font-sans text-[12px] text-secondary">
                  ALREADY HAVE AN ACCOUNT?{" "}
                  <Link
                    to="/login"
                    className="text-obsidian font-bold underline hover:text-altitude-orange transition-colors uppercase tracking-[0.1em]"
                  >
                    SIGN IN
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
