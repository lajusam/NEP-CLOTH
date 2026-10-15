const statusMap = {
  pending: ['warning', 'Pending'], confirmed: ['info', 'Confirmed'], shipped: ['indigo', 'Shipped'],
  delivered: ['success', 'Delivered'], cancelled: ['danger', 'Cancelled'], paid: ['success', 'Paid'],
  unpaid: ['warning', 'Unpaid'], active: ['success', 'Active'], archived: ['neutral', 'Archived'],
  draft: ['neutral', 'Draft'], lowstock: ['warning', 'Low stock'], low: ['warning', 'Low stock'],
  oos: ['danger', 'Out of stock'], outofstock: ['danger', 'Out of stock'], instock: ['success', 'In stock'],
  men: ['outline', 'Men'], women: ['outline', 'Women'],
};

export default function AdminBadge({ variant = 'neutral', label, className = '' }) {
  const [tone, defaultLabel] = statusMap[String(variant).toLowerCase()] || ['neutral', String(variant)];
  return <span className={`admin-badge admin-badge-${tone}${className ? ` ${className}` : ''}`}><span className="admin-badge-dot" aria-hidden="true" />{label || defaultLabel}</span>;
}
