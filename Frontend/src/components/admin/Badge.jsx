import AdminBadge from './ui/AdminBadge';

export default function Badge({ variant = 'active', label, className = '' }) {
  return <AdminBadge variant={variant} label={label} className={className} />;
}
