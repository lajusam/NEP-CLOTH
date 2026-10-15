import { useState, useEffect, useRef } from 'react';
import { Loader2, Check } from 'lucide-react';
import gsap from 'gsap';
import Badge from './Badge';
import AdminNumberStepper from './ui/AdminNumberStepper';
import AdminButton from './ui/AdminButton';
import { AdminAlert, AdminEmptyState } from './ui/AdminFeedback';
import { useAdminToast } from './ui/useAdminToast';

const columns = ['Product', 'Variant', 'SKU', 'Section', 'Category', 'Stock quantity', 'Status', 'Quick update'];

export default function InventoryTable({
  filter = 'ALL',
  rows = [],
  loading = false,
  error = null,
  onRetry,
  onStockUpdate,
}) {
  const tableRef = useRef(null);
  const [stockInputs, setStockInputs] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const toast = useAdminToast();

  // Sync inputs with rows
  useEffect(() => {
    const map = {};
    for (const r of rows) {
      map[r.id] = r.stock;
    }
    setStockInputs(map);
  }, [rows]);

  const filtered = rows.filter((i) => {
    if (filter === 'NEEDS RESTOCK') return i.active && i.stock >= 0 && i.stock <= 4;
    if (filter === 'LOW STOCK') return i.active && i.stock > 0 && i.stock <= 4;
    if (filter === 'OUT OF STOCK') return i.active && i.stock === 0;
    return true;
  });

  useEffect(() => {
    if (!tableRef.current || loading || filtered.length === 0) return;
    const trs = tableRef.current.querySelectorAll('tbody tr');
    if (!trs.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        trs,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.02 }
      );
    });
    return () => ctx.revert();
  }, [filter, loading, filtered.length]);

  const handleSave = async (item) => {
    const rawVal = stockInputs[item.id];
    const val = parseInt(rawVal, 10);
    if (isNaN(val) || val < 0) {
      toast('Stock quantity must be a whole number of 0 or more.', 'error');
      return;
    }

    setSavingId(item.id);
    try {
      if (onStockUpdate) {
        await onStockUpdate(item.id, val);
      }
      setSavedId(item.id);
      toast('Variant stock updated.', 'success');
      setTimeout(() => setSavedId(null), 1500);
    } catch (err) {
      toast(err.message || 'Failed to update stock.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div ref={tableRef} className="admin-table-card">
      {error && <div className="admin-card-body"><AdminAlert tone="error" title="Inventory could not be loaded">{error}<AdminButton variant="secondary" size="sm" onClick={onRetry}>Retry</AdminButton></AdminAlert></div>}
      <div className="admin-table-scroll">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              {columns.map((col) => (
                <th
                  key={col}
                  className="font-sans text-[12px] tracking-[0.22em] text-secondary uppercase text-left px-6 py-4 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex items-center justify-center gap-3 text-secondary font-sans text-[12px] uppercase tracking-[0.2em]">
                    <Loader2 size={18} className="animate-spin text-obsidian" />
                    <span>Loading Warehouse Inventory...</span>
                  </div>
                </td>
              </tr>
            ) : error ? null : filtered.length === 0 ? (
              <tr><td colSpan={columns.length}><AdminEmptyState title="No matching inventory" description="There are no variants in this stock range." /></td></tr>
            ) : (
              filtered.map((item) => {
                const isOOS = item.stock === 0;
                const isLow = item.stock > 0 && item.stock < 5;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-obsidian/5 hover:bg-surface-container transition-colors duration-150 ${
                      isOOS ? 'bg-altitude-orange/[0.02]' : isLow ? 'bg-amber-500/[0.02]' : ''
                    }`}
                  >
                    {/* Product Name */}
                    <td className="font-sans text-[14px] text-obsidian px-6 py-4 whitespace-nowrap font-medium">
                      <div className="admin-inventory-product"><span className="admin-inventory-thumb">{item.image ? <img src={item.image} alt="" /> : item.productName.slice(0, 2).toUpperCase()}</span><span title={item.productName} className="admin-name-truncate">{item.productName}</span></div>
                      {!item.active && (
                        <span className="ml-2 font-sans text-[10px] text-secondary uppercase tracking-widest border border-obsidian/10 px-1 py-0.5">
                          Archived
                        </span>
                      )}
                    </td>

                    {/* Variant & SKU */}
                    <td className="font-sans text-[13px] text-secondary px-6 py-4 whitespace-nowrap"><span className="font-medium text-obsidian">{item.size || 'One size'}{item.color ? ` / ${item.color}` : ''}</span></td>
                    <td className="font-mono text-[12px] text-secondary px-6 py-4 whitespace-nowrap">{item.sku}</td>

                    {/* Section */}
                    <td className="px-6 py-4">
                      <span className="border border-obsidian/20 font-sans text-[11px] uppercase tracking-[0.15em] px-1.5 py-0.5 text-obsidian">
                        {item.section}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="font-sans text-[13px] text-secondary px-6 py-4 whitespace-nowrap uppercase tracking-wider text-[11px]">
                      {item.category}
                    </td>

                    {/* Stock Qty */}
                    <td className="font-mono text-[14px] px-6 py-4 font-semibold">
                      <span
                        className={
                          isOOS
                            ? 'text-altitude-orange'
                            : isLow
                            ? 'text-amber-600'
                            : 'text-obsidian'
                        }
                      >
                        {item.stock}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <Badge variant={item.status} />
                    </td>

                    {/* Quick Update */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AdminNumberStepper
                          min={0}
                          label={`Stock quantity for ${item.productName} ${item.size || 'one size'}`}
                          value={stockInputs[item.id] !== undefined ? stockInputs[item.id] : item.stock}
                          onChange={(value) => setStockInputs((s) => ({ ...s, [item.id]: value }))}
                        />
                        {Number(stockInputs[item.id] ?? item.stock) !== Number(item.stock) && <button
                          disabled={savingId === item.id}
                          onClick={() => handleSave(item)}
                          className="admin-button admin-button-primary admin-button-sm"
                        >
                          {savingId === item.id ? (
                            <Loader2 size={12} className="animate-spin text-obsidian" />
                          ) : savedId === item.id ? (
                            <span className="text-obsidian flex items-center gap-0.5">
                              <Check size={12} /> SAVED
                            </span>
                          ) : (
                            'SAVE'
                          )}
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && !error && <div className="admin-mobile-cards">{filtered.map((item) => <article className="admin-mobile-card" key={item.id}><strong>{item.productName}</strong><span className="admin-muted-note">{item.size || 'One size'}{item.color ? ` / ${item.color}` : ''} · {item.sku}</span><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Section / category</span><span>{item.section} · {item.category}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Current status</span><Badge variant={item.status} /></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Update quantity</span><div className="admin-actions"><AdminNumberStepper min={0} label={`Stock quantity for ${item.productName}`} value={stockInputs[item.id] ?? item.stock} onChange={(value) => setStockInputs((s) => ({ ...s, [item.id]: value }))} />{Number(stockInputs[item.id] ?? item.stock) !== Number(item.stock) && <AdminButton size="sm" onClick={() => handleSave(item)} loading={savingId === item.id}>Save</AdminButton>}</div></div></article>)}</div>}
    </div>
  );
}
