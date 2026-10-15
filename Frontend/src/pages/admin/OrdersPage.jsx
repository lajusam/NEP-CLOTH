import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import Badge from '../../components/admin/Badge';
import { fetchAdminOrders, formatPrice } from '../../lib/api';

const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const columns = ['ORDER ID', 'DATE', 'CUSTOMER', 'ITEMS', 'TOTAL', 'PAYMENT', 'STATUS', 'ACTIONS'];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status')?.toUpperCase() || 'ALL';
  const [activeTab, setActiveTabState] = useState(tabs.includes(requestedStatus) ? requestedStatus : 'ALL');
  const setActiveTab = (next) => { setActiveTabState(next); setSearchParams(next === 'ALL' ? {} : { status: next.toLowerCase() }); };
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const pageRef = useRef(null);
  const titleRef = useRef(null);

  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');

  const applyDatePreset = (days) => {
    const today = new Date();
    const to = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days + 1);
    const from = [fromDate.getFullYear(), String(fromDate.getMonth() + 1).padStart(2, '0'), String(fromDate.getDate()).padStart(2, '0')].join('-');
    setDateFrom(from); setDateTo(to);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        status: activeTab,
        search,
        from: dateFrom,
        to: dateTo,
        page,
        limit: 20,
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, dateFrom, dateTo, page]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, dateFrom, dateTo]);

  // Load orders on filter or page change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div ref={pageRef} className="px-8 py-8">
      {/* Top bar */}
      <div className="admin-page-header">
        <div ref={titleRef}>
          <span className="admin-eyebrow">
            Management
          </span>
          <h1 className="admin-page-title">
            Orders
          </h1>
        </div>

        {/* Search & date filters */}
        <div className="admin-page-actions">
          <div className="relative">
            <Search size={15} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search order, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-b border-obsidian/20 text-obsidian font-sans text-[13px] pl-6 pr-4 py-2 w-[240px] focus:border-obsidian focus:outline-none transition-colors duration-200 placeholder:text-secondary/50"
            />
          </div>

          <details className="admin-date-popover"><summary className="admin-button admin-button-secondary admin-button-md">{dateFrom || dateTo ? `${dateFrom || '…'} – ${dateTo || '…'}` : 'Date range'}</summary><div className="admin-date-popover-panel"><div className="admin-date-presets"><button type="button" onClick={() => applyDatePreset(1)}>Today</button><button type="button" onClick={() => applyDatePreset(7)}>Last 7 days</button><button type="button" onClick={() => applyDatePreset(30)}>Last 30 days</button></div><span className="admin-date-custom-label">Custom range</span><label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></div></details>

          {(dateFrom || dateTo || search) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearch('');
              }}
              className="font-sans text-[10px] uppercase tracking-[0.2em] text-secondary hover:text-altitude-orange transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={loadOrders}
            title="Refresh orders"
            aria-label="Refresh orders"
            className="admin-button admin-button-secondary admin-button-icon-only admin-button-md"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="admin-segmented mb-4" role="group" aria-label="Filter orders by status">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button" aria-pressed={activeTab === tab}
          >
            {tab === 'ALL' ? 'All' : `${tab[0]}${tab.slice(1).toLowerCase()}`}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 border border-altitude-orange/30 bg-altitude-orange/5 text-altitude-orange flex items-center justify-between">
          <p className="font-sans text-[13px]">{error}</p>
          <button
            onClick={loadOrders}
            className="font-sans text-[11px] uppercase tracking-[0.2em] underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders table */}
      <div className="border border-obsidian/10 bg-surface-bright">
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
                      Loading orders...
                    </p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <p className="font-sans text-[13px] text-secondary">
                      No orders found matching the criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const dateStr = new Date(o.createdAt).toLocaleDateString('en-NP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-obsidian/5 hover:bg-surface-container transition-colors duration-150"
                    >
                      <td
                        className="font-mono text-[13px] text-obsidian px-6 py-4 whitespace-nowrap cursor-pointer hover:underline"
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                      >
                        {o.orderNumber || o.id}
                      </td>
                      <td className="font-sans text-[14px] text-secondary px-6 py-4 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="font-sans text-[14px] text-obsidian px-6 py-4 whitespace-nowrap">
                        <div>
                          <span>{o.customerName}</span>
                          {o.phone && (
                            <span className="block font-sans text-[11px] text-secondary">{o.phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-[14px] text-obsidian px-6 py-4">
                        {o.itemCount}
                      </td>
                      <td className="font-mono text-[14px] text-obsidian px-6 py-4 whitespace-nowrap">
                        {formatPrice(o.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={o.paymentStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={o.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                          className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary border-b border-current pb-0.5 hover:text-altitude-orange hover:border-altitude-orange transition-colors cursor-pointer"
                        >
                          VIEW →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && orders.length > 0 && <div className="admin-mobile-cards">{orders.map((o) => <article className="admin-mobile-card" key={o.id}><div className="admin-mobile-card-row"><strong>{o.orderNumber || o.id}</strong><Badge variant={o.status} /></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Customer</span><span>{o.customerName}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Date</span><span>{new Date(o.createdAt).toLocaleDateString('en-NP')}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Items / total</span><span>{o.itemCount} · {formatPrice(o.total)}</span></div><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">Payment</span><Badge variant={o.paymentStatus} /></div><button type="button" className="admin-button admin-button-secondary" onClick={() => navigate(`/admin/orders/${o.id}`)}>View order</button></article>)}</div>}

        {/* Pagination controls */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-obsidian/10">
            <span className="font-sans text-[12px] text-secondary">
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-obsidian/20 text-obsidian disabled:opacity-30 disabled:cursor-not-allowed hover:border-obsidian transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-[12px] text-obsidian px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-obsidian/20 text-obsidian disabled:opacity-30 disabled:cursor-not-allowed hover:border-obsidian transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
