import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-white/10 py-[120px] w-full">
      <div className="footer-inner container-page grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Logo + tagline */}
      <div className="col-span-1 md:col-span-4 mb-8">
        <Link to="/" className="font-display text-xl text-stark-white uppercase tracking-widest">
          NEP AESTHETIC
        </Link>
        <p className="font-editorial text-[15px] text-[#e2e2e2] mt-2 max-w-sm leading-[1.8]">
          Where Kathmandu heritage meets European luxury. Crafted for altitude.
        </p>
      </div>

      {/* Shop */}
      <div className="flex flex-col gap-4">
        <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-2">
          SHOP
        </span>
        <Link
          to="/women"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          WOMEN
        </Link>
        <Link
          to="/men"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          MEN
        </Link>
        <Link
          to="/men"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          NEW ARRIVALS
        </Link>
      </div>

      {/* Help */}
      <div className="flex flex-col gap-4">
        <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-2">
          HELP
        </span>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          CLIENT SERVICE
        </a>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          SHIPPING & RETURNS
        </a>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          SIZE GUIDE
        </a>
      </div>

      {/* Company */}
      <div className="flex flex-col gap-4">
        <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-2">
          COMPANY
        </span>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          ABOUT
        </a>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          CAREERS
        </a>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          LEGAL NOTICES
        </a>
      </div>

      {/* Social */}
      <div className="flex flex-col gap-4">
        <span className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.22em] mb-2">
          FOLLOW
        </span>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          INSTAGRAM
        </a>
        <a
          href="#"
          className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] hover:text-[#ffb59e] transition-colors"
        >
          TIKTOK
        </a>
      </div>

      {/* Bottom copyright */}
      <div className="col-span-1 md:col-span-4 mt-8 border-t border-stark-white/10 pt-6">
        <span className="font-sans text-[12px] uppercase tracking-[0.15em] text-[#e2e2e2] text-xs">
          © 2024 NEP AESTHETIC. ALL RIGHTS RESERVED.
        </span>
      </div>
      </div>
    </footer>
  );
}
