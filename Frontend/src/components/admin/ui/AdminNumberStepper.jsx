import { Minus, Plus } from 'lucide-react';

export default function AdminNumberStepper({ value, onChange, min = 0, disabled = false, label = 'Quantity', className = '' }) {
  const current = Number(value) || 0;
  return <div className={`admin-number-stepper${className ? ` ${className}` : ''}`}>
    <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || current <= min} onClick={() => onChange(Math.max(min, current - 1))}><Minus size={14} /></button>
    <input aria-label={label} type="number" min={min} step="1" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    <button type="button" aria-label={`Increase ${label}`} disabled={disabled} onClick={() => onChange(current + 1)}><Plus size={14} /></button>
  </div>;
}
