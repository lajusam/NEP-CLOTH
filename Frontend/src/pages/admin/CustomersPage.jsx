import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import CustomersTable from '../../components/admin/CustomersTable';
import { fetchAdminCustomers } from '../../lib/api';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageRef = useRef(null);
  const titleRef = useRef(null);

  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCustomers({ search, page, limit: 20 });
      setCustomers(data.customers || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Load when search or page changes
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div ref={pageRef} className="px-8 py-8">
      {/* Title + search bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div ref={titleRef}>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
            CRM
          </span>
          <h1 className="font-display text-[clamp(48px,6vw,80px)] leading-none tracking-tight text-obsidian uppercase">
            Customers
          </h1>
        </div>

        {/* Live Customer Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-b border-obsidian/20 text-obsidian font-sans text-[13px] pl-6 pr-4 py-2 w-[260px] focus:border-obsidian focus:outline-none transition-colors duration-200 placeholder:text-secondary/50"
            />
          </div>

          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-sans text-[10px] uppercase tracking-[0.2em] text-secondary hover:text-altitude-orange transition-colors"
            >
              CLEAR
            </button>
          )}

          <button
            onClick={loadCustomers}
            title="Refresh"
            className="p-2 border border-obsidian/10 hover:border-obsidian text-secondary hover:text-obsidian transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 border border-altitude-orange/30 bg-altitude-orange/5 text-altitude-orange flex items-center justify-between">
          <p className="font-sans text-[13px]">{error}</p>
          <button
            onClick={loadCustomers}
            className="font-sans text-[11px] uppercase tracking-[0.2em] underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Real customers table */}
      <CustomersTable customers={customers} loading={loading} />

      {/* Pagination controls */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4 mt-2">
          <span className="font-sans text-[12px] text-secondary">
            Showing {customers.length} of {pagination.total} customers
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-obsidian/20 text-obsidian disabled:opacity-30 disabled:cursor-not-allowed hover:border-obsidian transition-colors cursor-pointer"
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
              className="p-1.5 border border-obsidian/20 text-obsidian disabled:opacity-30 disabled:cursor-not-allowed hover:border-obsidian transition-colors cursor-pointer"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
