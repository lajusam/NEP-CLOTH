import { useEffect, useRef } from "react";

export default function ReviewDialog({ open, title, description, children, onClose, onConfirm, busy, confirmLabel = "CONFIRM", tone = "default" }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector("select, button:not(:disabled), input, textarea")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose?.();
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = [...dialog.querySelectorAll("button:not(:disabled), select:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href]")];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return <div className="review-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose?.(); }}>
    <section ref={dialogRef} className="review-dialog" role="alertdialog" aria-modal="true" aria-labelledby="review-dialog-title" aria-describedby="review-dialog-description">
      <span className="review-dialog-eyebrow">NEP CLOTH · CUSTOMER REVIEWS</span>
      <h2 id="review-dialog-title">{title}</h2>
      <p id="review-dialog-description">{description}</p>
      {children && <div className="review-dialog-content">{children}</div>}
      <div className="review-dialog-actions">
        <button type="button" className="review-dialog-cancel" onClick={onClose} disabled={busy}>CANCEL</button>
        <button type="button" className={`review-dialog-confirm${tone === "danger" ? " is-danger" : ""}`} onClick={onConfirm} disabled={busy}>{busy ? "PLEASE WAIT…" : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
