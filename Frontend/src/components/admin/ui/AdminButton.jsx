import { cloneElement, isValidElement } from 'react';
import { LoaderCircle } from 'lucide-react';

function renderIcon(icon) {
  if (!icon) return null;
  if (isValidElement(icon)) return cloneElement(icon, { size: 16, 'aria-hidden': true });
  const Icon = icon;
  return <Icon size={16} aria-hidden="true" />;
}

export default function AdminButton({
  children, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight,
  iconOnly = false, loading = false, disabled = false, type = 'button', className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`admin-button admin-button-${variant} admin-button-${size}${iconOnly ? ' admin-button-icon-only' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="admin-spin" aria-hidden="true" /> : renderIcon(Icon)}
      {!iconOnly && <span>{children}</span>}
      {!loading && !iconOnly && renderIcon(IconRight)}
    </button>
  );
}
