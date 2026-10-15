import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatCard({ label, value, sub, icon: Icon, to, unavailable = false }) {
  const content = <>
    <span className="admin-stat-icon">{Icon && <Icon size={18} aria-hidden="true" />}</span>
    <p className="admin-stat-label">{label}</p>
    <p className={`admin-stat-value${unavailable ? ' is-unavailable' : ''}`}>{value}</p>
    {sub && <p className="admin-stat-sub">{sub}</p>}
    {to && <ArrowUpRight className="admin-stat-link-icon" size={16} aria-hidden="true" />}
  </>;
  return to ? <Link className="admin-stat-card admin-stat-link" to={to}>{content}</Link> : <div className="admin-stat-card">{content}</div>;
}
