import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../../components/admin/Sidebar';
import { AdminToastProvider } from '../../components/admin/ui/AdminFeedback';
import './admin-theme.css';

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMenuOpen(false), []);
  return (
    <AdminToastProvider>
      <div className="admin-theme">
        {menuOpen && <button type="button" className="admin-drawer-backdrop" aria-label="Close navigation menu" onClick={closeMobileMenu} />}
        <Sidebar mobileOpen={menuOpen} onMobileClose={closeMobileMenu} />
        <div className="admin-main-column">
          <header className="admin-mobile-bar">
            <button type="button" className="admin-icon-control" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
            <span className="admin-mobile-brand">NEP CLOTH · Admin</span>
          </header>
          <main className="admin-main admin-content" id="admin-main-content"><Outlet /></main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
