import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Warehouse, ExternalLink, LogOut, X, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminReviewSummary } from '../../lib/api';

const navSections = [
  { label: 'Overview', items: [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true }] },
  { label: 'Catalog', items: [{ name: 'Products', path: '/admin/products', icon: Package }] },
  { label: 'Customer experience', items: [{ name: 'Reviews', path: '/admin/reviews', icon: Star, reviewCount: true }] },
  { label: 'Orders', items: [{ name: 'All orders', path: '/admin/orders', icon: ShoppingCart }] },
  { label: 'Customers', items: [{ name: 'All customers', path: '/admin/customers', icon: Users }] },
  { label: 'Inventory', items: [{ name: 'Stock levels', path: '/admin/inventory', icon: Warehouse }] },
];

export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }) {
  const asideRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [reportedReviews, setReportedReviews] = useState(0);
  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  useEffect(() => {
    let active = true;
    fetchAdminReviewSummary().then((summary) => { if (active) setReportedReviews(Number(summary.reported) || 0); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.activeElement;
    const aside = asideRef.current;
    const focusables = () => [...(aside?.querySelectorAll('a[href], button:not(:disabled)') || [])];
    focusables()[0]?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onMobileClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus?.(); };
  }, [mobileOpen, onMobileClose]);

  const handleLogout = async () => {
    try { await signOut(); navigate('/login'); }
    catch (error) { console.error('Logout error:', error); }
  };

  return <aside ref={asideRef} className={`admin-sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="Admin navigation" aria-modal={mobileOpen || undefined} role={mobileOpen ? 'dialog' : undefined}>
    <div className="admin-sidebar-top">
      <Link to="/" className="admin-sidebar-brand" title="View store" onClick={onMobileClose}>
        <span className="admin-brand-title">NEP CLOTH</span>
        <span className="admin-brand-caption">Store administration</span>
      </Link>
      <button type="button" className="admin-icon-control admin-sidebar-close" aria-label="Close navigation menu" onClick={onMobileClose}><X size={18} /></button>
    </div>

    <nav className="admin-sidebar-nav">
      {navSections.map((section) => <div className="admin-nav-section" key={section.label}>
        <p className="admin-nav-label">{section.label}</p>
        {section.items.map((item) => <NavLink key={item.path} to={item.path} end={item.end} onClick={onMobileClose} className={({ isActive }) => `admin-nav-item${isActive ? ' is-active' : ''}`}>
          <item.icon size={18} aria-hidden="true" /><span>{item.name}</span>{item.reviewCount && reportedReviews > 0 && <span className="admin-nav-count" aria-label={`${reportedReviews} reported reviews`}>{reportedReviews > 99 ? '99+' : reportedReviews}</span>}
        </NavLink>)}
      </div>)}
      <a href="/" className="admin-nav-item admin-view-store" onClick={onMobileClose}><ExternalLink size={18} aria-hidden="true" /><span>View store</span></a>
    </nav>

    <div className="admin-user-block">
      <div className="admin-user-avatar" aria-hidden="true">{initials}</div>
      <div className="admin-user-detail"><span className="admin-user-name" title={displayName}>{displayName}</span><span className="admin-user-role">Administrator</span></div>
      <button type="button" className="admin-icon-control admin-logout" onClick={handleLogout} aria-label="Log out"><LogOut size={18} /></button>
    </div>
  </aside>;
}
