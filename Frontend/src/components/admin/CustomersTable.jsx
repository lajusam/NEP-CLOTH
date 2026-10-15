import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '../../lib/api';

const columns = ['NAME', 'EMAIL', 'PHONE', 'ORDERS', 'TOTAL SPENT', 'JOINED'];

export default function CustomersTable({ customers = [], loading = false }) {
  const tableRef = useRef(null);

  useEffect(() => {
    if (!tableRef.current) return;
    const trs = tableRef.current.querySelectorAll('tbody tr.customer-row');
    if (!trs.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(trs,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.03 }
      );
    });
    return () => ctx.revert();
  }, [customers]);

  return (
    <div ref={tableRef} className="admin-table-card">
      <div className="admin-table-scroll">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              {columns.map((col) => (
                <th key={col} className="font-sans text-[12px] tracking-[0.22em] text-secondary uppercase text-left px-6 py-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-secondary mb-2" />
                  <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-secondary">
                    Loading customers...
                  </p>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <p className="font-sans text-[13px] text-secondary">
                    No customers found matching the search.
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr
                  key={c.id}
                  className="customer-row border-b border-obsidian/5 hover:bg-surface-container transition-colors duration-150"
                >
                  <td className="font-sans text-[14px] text-obsidian px-6 py-4 whitespace-nowrap font-medium">
                    {c.name}
                  </td>
                  <td className="font-sans text-[13px] text-secondary px-6 py-4 whitespace-nowrap">
                    {c.email}
                  </td>
                  <td className="font-sans text-[13px] text-secondary px-6 py-4 whitespace-nowrap">
                    {c.phone || '—'}
                  </td>
                  <td className="font-mono text-[14px] text-obsidian px-6 py-4">
                    {c.orderCount}
                  </td>
                  <td className="font-mono text-[14px] text-obsidian px-6 py-4 whitespace-nowrap">
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td className="font-sans text-[13px] text-secondary px-6 py-4 whitespace-nowrap">
                    {new Date(c.joinedAt).toLocaleDateString('en-NP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && customers.length > 0 && <div className="admin-mobile-cards">{customers.map((c) => <article className="admin-mobile-card" key={c.id}><strong>{c.name || 'Unnamed customer'}</strong><span className="admin-muted-note">{c.email || 'No email'}</span><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Phone</span><span>{c.phone || '—'}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Orders</span><span>{c.orderCount ?? '—'}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Total spent</span><span>{formatPrice(c.totalSpent)}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Joined</span><span>{c.joinedAt ? new Date(c.joinedAt).toLocaleDateString('en-NP') : '—'}</span></div></article>)}</div>}
    </div>
  );
}
