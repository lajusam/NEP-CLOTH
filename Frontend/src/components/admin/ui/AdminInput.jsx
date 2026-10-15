import { AlertCircle } from 'lucide-react';

export default function AdminInput({ label, icon: Icon, error, id, className = '', ...props }) {
  const inputId = id || props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  return <div className={`admin-field${className ? ` ${className}` : ''}`}>
    {label && <label htmlFor={inputId}>{label}</label>}
    <div className="admin-input-wrap">{Icon && <Icon size={16} aria-hidden="true" />}<input id={inputId} aria-invalid={Boolean(error)} aria-describedby={errorId} {...props} /></div>
    {error && <span className="admin-field-error" id={errorId}><AlertCircle size={14} aria-hidden="true" />{error}</span>}
  </div>;
}
