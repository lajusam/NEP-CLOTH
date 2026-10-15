import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import AdminButton from './AdminButton';
import { AdminToastContext } from './AdminToastContext';

const toastIcons = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);
  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return <AdminToastContext.Provider value={notify}>{children}
    <div className="admin-toast-region" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => { const Icon = toastIcons[toast.tone] || Info; return <div key={toast.id} className={`admin-toast admin-toast-${toast.tone}`} role="status"><Icon size={18} aria-hidden="true" /><span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={16} /></button></div>; })}
    </div>
  </AdminToastContext.Provider>;
}

export function AdminAlert({ tone = 'info', title, children, action }) {
  const Icon = toastIcons[tone] || Info;
  return <div className={`admin-alert admin-alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}><Icon size={18} aria-hidden="true" /><div className="min-w-0 flex-1">{title && <strong>{title}</strong>}{children && <div>{children}</div>}</div>{action}</div>;
}

export function AdminEmptyState({ title = 'Nothing here yet', description, action }) {
  return <div className="admin-empty"><div><strong>{title}</strong>{description && <p>{description}</p>}{action}</div></div>;
}

export function AdminSkeleton({ rows = 4 }) {
  return <div className="admin-skeleton-list" aria-label="Loading" aria-busy="true">{Array.from({ length: rows }, (_, index) => <div key={index} className="admin-skeleton-row"><span className="admin-skeleton" /><span className="admin-skeleton" /><span className="admin-skeleton" /></div>)}</div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', tone = 'primary', busy = false, onConfirm, onClose }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector('button:not(:disabled)');
    first?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current?.(); }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!controls.length) return;
      const firstControl = controls[0]; const lastControl = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); returnFocusRef.current?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return <div className="admin-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose?.(); }}>
    <section ref={dialogRef} className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-description">
      <h2 id="admin-dialog-title">{title}</h2><p id="admin-dialog-description">{description}</p>
      <div className="admin-dialog-actions"><AdminButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</AdminButton><AdminButton variant={tone} onClick={onConfirm} loading={busy}>{confirmLabel}</AdminButton></div>
    </section>
  </div>;
}
