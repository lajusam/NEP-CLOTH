import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { IMAGES } from "../data/images";
import { fetchProducts, formatPrice, getMainImage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import FlowingMenu from "./FlowingMenu";

/* ── Nav overlay items for FlowingMenu ── */
const NAV_ITEMS = [
  { link: "/women", text: "WOMEN", image: "/images/cinematic_female_full_body.png" },
  { link: "/men", text: "MEN", image: "/images/male_black_coat_full_body.png" },
  { link: "/", text: "COLLECTIONS", image: "/images/four_models_group_campaign.png" },
  { link: "/", text: "EDITORIAL", image: "/images/aerial_female_lying_on_ancient.png" },
  { link: "/", text: "ABOUT", image: "/images/two_models_walking_woods.png" },
];

/* ── Mega menu data ── */
const MEGA_MENU_DATA = {
  women: {
    categories: ["New In", "Outerwear", "Tops", "Bottoms", "Accessories"],
    featured: ["Coats & Jackets", "Knitwear", "Trousers", "Accessories", "New Arrivals"],
    picks: [],
    campaign: "/womencloth/womenside/women1.jpg",
    label: "WOMEN",
  },
  men: {
    categories: ["New In", "Outerwear", "Tops", "Bottoms", "Footwear"],
    featured: ["Coats & Jackets", "Knitwear", "Trousers", "Accessories", "New Arrivals"],
    picks: [],
    campaign: "/mencloth/menside/men1.jpg",
    label: "MEN",
  },
};

export default function Navbar() {
  const navRef = useRef(null);
  const overlayRef = useRef(null);
  const megaMenuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const accountPanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalCount, openCart } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [overlayImage, setOverlayImage] = useState(NAV_ITEMS[0].image);
  const [megaMenu, setMegaMenu] = useState(null); // 'women' | 'men' | null
  const megaMenuTimeout = useRef(null);

  const picksQuery = useQuery({
    queryKey: ["navbar-picks", megaMenu],
    queryFn: () => fetchProducts({ section: megaMenu, limit: 2 }),
    enabled: Boolean(megaMenu),
    staleTime: 60_000,
  });
  const menuPicks = picksQuery.data || [];

  useEffect(() => {
    let previousY = window.scrollY;
    let ticking = false;
    const updateScrollState = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 4);
      if (menuOpen || accountOpen) {
        setNavHidden(false);
      } else if (currentY < 80) {
        setNavHidden(false);
      } else if (Math.abs(currentY - previousY) > 4) {
        setNavHidden(currentY > previousY);
      }
      previousY = currentY;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen, accountOpen]);

  const isActive = (path) => location.pathname === path;

  // Close overlay with GSAP
  const closeOverlay = useCallback(() => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        y: "-100%",
        duration: 0.5,
        ease: "power4.inOut",
        onComplete: () => {
          setMenuOpen(false);
          menuTriggerRef.current?.focus();
        },
      });
    } else {
      setMenuOpen(false);
      menuTriggerRef.current?.focus();
    }
  }, []);

  // Open overlay with GSAP
  useEffect(() => {
    if (menuOpen && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { y: "-100%" },
        { y: "0%", duration: 0.7, ease: "power4.inOut" }
      );
      // Stagger FlowingMenu items in
      const items = overlayRef.current.querySelectorAll(".flowing-menu-item");
      if (items.length) {
        gsap.fromTo(
          items,
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out", delay: 0.3 }
        );
      }
      const firstFocusable = overlayRef.current.querySelector("button, a[href]");
      firstFocusable?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !overlayRef.current) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(overlayRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((item) => item.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeOverlay]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointerDown = (event) => {
      if (!accountPanelRef.current?.contains(event.target) && !accountTriggerRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        accountTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  // Handle FlowingMenu navigation inside overlay
  const handleOverlayNavigate = useCallback(
    (link) => {
      closeOverlay();
      setTimeout(() => navigate(link), 500);
    },
    [closeOverlay, navigate]
  );

  // Mega menu show/hide
  const showMegaMenu = (gender) => {
    clearTimeout(megaMenuTimeout.current);
    setMegaMenu(gender);
  };

  const hideMegaMenu = () => {
    megaMenuTimeout.current = setTimeout(() => setMegaMenu(null), 150);
  };

  const keepMegaMenu = () => {
    clearTimeout(megaMenuTimeout.current);
  };

  // GSAP mega menu entrance
  useEffect(() => {
    if (megaMenu && megaMenuRef.current) {
      gsap.fromTo(
        megaMenuRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [megaMenu]);

  // Close mega menu with animation
  const closeMegaMenuAnimated = () => {
    if (megaMenuRef.current) {
      gsap.to(megaMenuRef.current, {
        y: -10,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => setMegaMenu(null),
      });
    } else {
      setMegaMenu(null);
    }
  };

  // Close menus on route change
  useEffect(() => {
    setMegaMenu(null);
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const megaData = megaMenu ? MEGA_MENU_DATA[megaMenu] : null;

  return (
    <>
      <nav ref={navRef} className={`site-navbar sticky top-0 z-[9998] bg-stark-white ${scrolled ? "is-scrolled" : ""} ${navHidden ? "is-hidden" : ""}`}>
        <div className="site-navbar-inner container-page">
          {/* Left nav links — desktop only */}
          <div className="site-navbar-left hidden lg:flex">
            <div
              onMouseEnter={() => showMegaMenu("women")}
              onMouseLeave={hideMegaMenu}
            >
              <Link
                to="/women"
                className={`font-sans text-[15px] uppercase tracking-[0.15em] transition-colors duration-300 ${isActive("/women")
                  ? "text-altitude-orange border-b border-altitude-orange pb-1"
                  : "text-secondary hover:text-altitude-orange"
                  }`}
              >
                WOMEN
              </Link>
            </div>
            <div
              onMouseEnter={() => showMegaMenu("men")}
              onMouseLeave={hideMegaMenu}
            >
              <Link
                to="/men"
                className={`font-sans text-[15px] uppercase tracking-[0.15em] transition-colors duration-300 ${isActive("/men")
                  ? "text-altitude-orange border-b border-altitude-orange pb-1"
                  : "text-secondary hover:text-altitude-orange"
                  }`}
              >
                MEN
              </Link>
            </div>
            <Link
              to="/"
              className={`font-sans text-[15px] uppercase tracking-[0.15em] transition-colors duration-300 ${isActive("/")
                ? "text-obsidian font-bold border-b border-obsidian pb-1"
                : "text-secondary hover:text-altitude-orange"
                }`}
            >
              EXPLORE
            </Link>
          </div>

          {/* Logo — perfectly centered */}
          <div className="site-navbar-brand">
            <Link
              to="/"
              className="font-display text-2xl lg:text-3xl tracking-tighter text-obsidian uppercase leading-none"
            >
              NEP CLOTH
            </Link>
          </div>

          {/* Right icons + Auth state + MENU button */}
          <div className="site-navbar-right">
            <button className="nav-icon-button nav-search hover:text-altitude-orange transition-colors duration-300" aria-label="Search">
              <span className="material-symbols-outlined text-obsidian text-2xl">search</span>
            </button>

            {/* One account control replaces the former row of account links. */}
            {user ? (
              <div className="account-control" ref={accountPanelRef}>
                <button
                  ref={accountTriggerRef}
                  type="button"
                  className="account-trigger"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  aria-controls="account-menu"
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <span className="material-symbols-outlined text-obsidian text-2xl" aria-hidden="true">person</span>
                  <span className="hidden min-[1280px]:inline max-w-[120px] truncate font-sans text-[11px] uppercase tracking-[0.12em]">
                    {(profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "ACCOUNT").split(/\s+/)[0]}
                  </span>
                </button>
                {accountOpen && (
                  <div id="account-menu" className="account-menu" role="group" aria-label="Account links">
                    <Link to="/account" onClick={() => setAccountOpen(false)}>ACCOUNT</Link>
                    <Link to="/orders" onClick={() => setAccountOpen(false)}>MY ORDERS</Link>
                    <Link to="/account/reviews" onClick={() => setAccountOpen(false)}>MY REVIEWS</Link>
                    {isAdmin && <Link to="/admin" onClick={() => setAccountOpen(false)}>ADMIN</Link>}
                    <button type="button" onClick={() => { setAccountOpen(false); signOut(); }}>LOG OUT</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/login"
                  className="font-sans text-[11px] uppercase tracking-[0.14em] text-obsidian hover:text-altitude-orange transition-colors font-medium"
                >
                  LOG IN
                </Link>
                <Link
                  to="/signup"
                  className="signup-nav-link"
                >
                  SIGN UP
                </Link>
              </div>
            )}

            {!user && <Link to="/login" className="nav-icon-button nav-login-icon hover:text-altitude-orange" aria-label="Log in">
              <span className="material-symbols-outlined text-obsidian text-2xl" aria-hidden="true">person</span>
            </Link>}

            {/* Shopping bag button with live count */}
            <button
              onClick={openCart}
              className="nav-icon-button hover:text-altitude-orange transition-colors duration-300 relative flex items-center cursor-pointer"
              aria-label={`Shopping bag with ${totalCount} items`}
            >
              <span className="material-symbols-outlined text-obsidian text-3xl">shopping_bag</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-altitude-orange text-obsidian font-sans text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center pointer-events-none">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </button>
            <button
              ref={menuTriggerRef}
              onClick={() => setMenuOpen(true)}
              className="nav-menu-trigger font-sans text-[12px] uppercase tracking-[0.18em] text-obsidian hover:text-altitude-orange transition-colors duration-300"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined nav-menu-icon" aria-hidden="true">menu</span>
              <span className="nav-menu-label">MENU</span>
            </button>
          </div>
        </div>

        {/* ── Mega Menu Dropdown ── */}
        {megaData && (
          <div
            ref={megaMenuRef}
            onMouseEnter={keepMegaMenu}
            onMouseLeave={() => closeMegaMenuAnimated()}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderBottom: "0.5px solid #000",
              zIndex: 9997,
              padding: "4rem",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "3rem" }}>
              {/* Column 1 — Categories */}
              <div>
                <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#000", letterSpacing: "0.15em", marginBottom: "20px" }}>
                  ALL {megaData.label}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {megaData.categories.map((cat) => (
                    <Link
                      key={cat}
                      to={megaMenu === "women" ? "/women" : "/men"}
                      className="mega-menu-link"
                      style={{
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#000",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        paddingLeft: "0px",
                        borderLeft: "0px solid #000",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderLeft = "0.5px solid #000";
                        e.currentTarget.style.paddingLeft = "8px";
                        gsap.to(e.currentTarget, { x: 4, duration: 0.2 });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderLeft = "0px solid #000";
                        e.currentTarget.style.paddingLeft = "0px";
                        gsap.to(e.currentTarget, { x: 0, duration: 0.2 });
                      }}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 2 — Featured */}
              <div>
                <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#000", letterSpacing: "0.15em", marginBottom: "20px" }}>
                  FEATURED
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {megaData.featured.map((feat) => (
                    <Link
                      key={feat}
                      to={megaMenu === "women" ? "/women" : "/men"}
                      className="mega-menu-link"
                      style={{
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#000",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        paddingLeft: "0px",
                        borderLeft: "0px solid #000",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderLeft = "0.5px solid #000";
                        e.currentTarget.style.paddingLeft = "8px";
                        gsap.to(e.currentTarget, { x: 4, duration: 0.2 });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderLeft = "0px solid #000";
                        e.currentTarget.style.paddingLeft = "0px";
                        gsap.to(e.currentTarget, { x: 0, duration: 0.2 });
                      }}
                    >
                      {feat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 3 — Editor's Picks */}
              <div>
                <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#000", letterSpacing: "0.15em", marginBottom: "20px" }}>
                  EDITOR&apos;S PICK
                </h4>
                <div style={{ display: "flex", gap: "16px" }}>
                  {menuPicks.map((product) => (
                    <Link
                      key={product.id || product.slug}
                      to={`/product/${product.slug || product.id}`}
                      state={{ product }}
                      style={{ width: "180px", textDecoration: "none", color: "#000" }}
                      onClick={() => setMegaMenu(null)}
                    >
                      <div style={{ width: "180px", aspectRatio: "3/4", overflow: "hidden" }}>
                        <img
                          src={getMainImage(product)}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top",
                            transition: "transform 0.4s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        />
                      </div>
                      <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", textTransform: "uppercase", color: "#000", margin: "8px 0 2px", letterSpacing: "0.1em" }}>
                        {product.name}
                      </p>
                      <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "11px", color: "#000" }}>
                        {formatPrice(product.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 4 — Campaign Image */}
              <div>
                <div style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden" }}>
                  <img
                    src={megaData.campaign}
                    alt={`${megaData.label} Campaign`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                </div>
                <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "10px", textTransform: "uppercase", color: "#000", marginTop: "8px", letterSpacing: "0.1em" }}>
                  SS 2026 COLLECTION
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Fullscreen overlay with FlowingMenu ─── */}
      {menuOpen && (
        <div
          ref={overlayRef}
          className="nav-fullscreen-overlay fixed inset-0 bg-obsidian flex overflow-hidden"
          style={{ zIndex: 9999, transform: "translateY(-100%)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          {/* Close button */}
          <button
            onClick={closeOverlay}
            type="button"
            autoFocus
            className="absolute top-8 right-6 md:right-20 font-sans text-[11px] text-stark-white uppercase tracking-[0.22em] hover:text-altitude-orange transition-colors z-10"
            aria-label="Close menu"
          >
            CLOSE ✕
          </button>

          <nav className="mobile-menu-links" aria-label="Main navigation">
            <Link to="/women" onClick={closeOverlay}>WOMEN</Link>
            <Link to="/men" onClick={closeOverlay}>MEN</Link>
            <Link to="/" onClick={closeOverlay}>EXPLORE</Link>
            <Link to={user ? "/account" : "/login"} onClick={closeOverlay}>ACCOUNT</Link>
          </nav>

          {/* Left — FlowingMenu */}
          <div style={{ width: "60%", height: "100%", position: "relative" }} className="nav-overlay-flowing desktop-menu-content">
            <FlowingMenu
              items={NAV_ITEMS}
              speed={12}
              textColor="#ffffff"
              bgColor="#000000"
              marqueeBgColor="#ffffff"
              marqueeTextColor="#000000"
              borderColor="rgba(255,255,255,0.15)"
              onItemHover={(img) => { if (img) setOverlayImage(img); }}
              onNavigate={handleOverlayNavigate}
            />
          </div>

          {/* Right — campaign image preview */}
          <div className="hidden lg:block relative desktop-menu-content" style={{ width: "40%" }}>
            <img
              key={overlayImage}
              src={overlayImage}
              alt="Campaign"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 15%", transition: "opacity 0.3s" }}
            />
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.12)" }} />
          </div>

          {/* Overlay Bottom Auth Links */}
          <div className="mobile-menu-account absolute bottom-8 left-6 md:left-20 z-10 flex items-center gap-6">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeOverlay}
                    className="font-sans text-[11px] text-altitude-orange uppercase tracking-[0.2em] hover:text-stark-white transition-colors font-bold"
                  >
                    ADMIN PORTAL
                  </Link>
                )}
                <Link
                  to="/account"
                  onClick={closeOverlay}
                  className="font-sans text-[11px] text-stark-white uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors"
                >
                  MY ACCOUNT ({profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "CLIENT"})
                </Link>
                <Link
                  to="/orders"
                  onClick={closeOverlay}
                  className="font-sans text-[11px] text-stark-white uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors"
                >
                  MY ORDERS
                </Link>
                <Link
                  to="/account/reviews"
                  onClick={closeOverlay}
                  className="font-sans text-[11px] text-stark-white uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors"
                >
                  MY REVIEWS
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    closeOverlay();
                  }}
                  className="font-sans text-[11px] text-zinc-400 uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors cursor-pointer"
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeOverlay}
                  className="font-sans text-[11px] text-stark-white uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors"
                >
                  LOG IN
                </Link>
                <span className="text-zinc-600 text-xs">/</span>
                <Link
                  to="/signup"
                  onClick={closeOverlay}
                  className="font-sans text-[11px] text-zinc-400 uppercase tracking-[0.2em] hover:text-altitude-orange transition-colors"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
