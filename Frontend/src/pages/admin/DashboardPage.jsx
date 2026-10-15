import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Clock3, PackageCheck, ShoppingCart, ArrowRight } from 'lucide-react';
import { useAdminPageEntry } from '../../hooks/useGSAP';
import StatCard from '../../components/admin/StatCard';
import SalesChart from '../../components/admin/SalesChart';
import Badge from '../../components/admin/Badge';
import { AdminAlert, AdminEmptyState, AdminSkeleton } from '../../components/admin/ui/AdminFeedback';
import { fetchAdminDashboard, fetchAdminProducts, fetchAdminReviewSummary, formatPrice } from '../../lib/api';

function inventorySummary(products) {
  const active = products.filter((product) => product.active !== false);
  const stockOf = (product) => (product.variants || []).reduce((total, variant) => total + (Number(variant.stock) || 0), 0);
  const needsRestock = active.filter((product) => (product.variants || []).some((variant) => Number(variant.stock) <= 4));
  const low = active.filter((product) => (product.variants || []).some((variant) => Number(variant.stock) >= 1 && Number(variant.stock) <= 4));
  const out = active.filter((product) => (product.variants || []).some((variant) => Number(variant.stock) === 0));
  return { needsRestock, low, out, leastStock: [...active].sort((a, b) => stockOf(a) - stockOf(b)).slice(0, 5).map((product) => ({ ...product, totalStock: stockOf(product) })) };
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [inventory, setInventory] = useState({ products: [], complete: false, error: null, loading: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportedReviews, setReportedReviews] = useState(null);
  const pageRef = useRef(null);
  useAdminPageEntry(pageRef);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchAdminDashboard()); }
    catch (requestError) { setError(requestError.message || 'Could not load dashboard data.'); }
    finally { setLoading(false); }
  }, []);

  const loadInventorySummary = useCallback(async () => {
    setInventory((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetchAdminProducts({ page: 1, limit: 50 });
      const products = response.data || [];
      setInventory({ products, complete: Number(response.meta?.total ?? products.length) <= products.length, error: null, loading: false });
    } catch (requestError) {
      setInventory({ products: [], complete: false, error: requestError.message || 'Could not load inventory summary.', loading: false });
    }
  }, []);

  useEffect(() => { loadDashboard(); loadInventorySummary(); }, [loadDashboard, loadInventorySummary]);
  useEffect(() => { fetchAdminReviewSummary().then((result) => setReportedReviews(Number(result.reported) || 0)).catch(() => setReportedReviews(null)); }, []);
  const metrics = data?.metrics || {};
  const summary = inventorySummary(inventory.products);
  const summaryAvailable = inventory.complete && !inventory.error && !inventory.loading;

  return <div ref={pageRef} className="px-8 py-8 admin-dashboard-page">
    <header className="admin-page-header"><div><span className="admin-eyebrow">Overview</span><h1>Dashboard</h1><p>Store performance and operations at a glance.</p></div><div className="admin-page-actions"><button type="button" className="admin-button admin-button-secondary admin-button-md" onClick={() => { loadDashboard(); loadInventorySummary(); }}>Refresh data</button></div></header>
    {error && <AdminAlert tone="error" title="Dashboard unavailable" action={<button type="button" className="admin-button admin-button-secondary admin-button-sm" onClick={loadDashboard}>Retry</button>}>{error}</AdminAlert>}

    <section className="admin-stat-grid" aria-label="Store metrics">
      <StatCard label="Revenue (delivered orders)" value={loading ? '—' : formatPrice(metrics.totalRevenue ?? 0)} sub="All-time delivered revenue" icon={Banknote} />
      <StatCard label="Orders" value={loading ? '—' : (metrics.totalOrders ?? '—')} sub="All-time placed orders" icon={ShoppingCart} />
      <StatCard label="Pending orders" value={loading ? '—' : (metrics.pendingOrders ?? '—')} sub="Awaiting confirmation" icon={Clock3} to="/admin/orders?status=pending" />
      <StatCard label="Needs restock" value={inventory.loading ? '—' : summaryAvailable ? summary.needsRestock.length : 'Unavailable'} sub={summaryAvailable ? `${summary.low.length} low · ${summary.out.length} out of stock` : 'Requires complete product data'} icon={PackageCheck} to="/admin/inventory?filter=NEEDS%20RESTOCK" unavailable={!summaryAvailable} />
    </section>

    {inventory.error && <AdminAlert tone="warning" title="Inventory summary unavailable">The restock total is omitted because product data could not be loaded.</AdminAlert>}
    {!inventory.complete && !inventory.error && !inventory.loading && <AdminAlert tone="warning" title="Inventory summary is partial">More than 50 products are in the catalog. The dashboard will not present a partial count as a total.</AdminAlert>}

    {loading ? <section className="admin-card admin-chart-loading"><AdminSkeleton rows={3} /></section> : <SalesChart data7d={data?.sales7d} data30d={data?.sales30d} />}

    <div className="admin-dashboard-grid">
      <section className="admin-card" aria-labelledby="recent-orders-heading">
        <header className="admin-card-header"><div><span className="admin-eyebrow">Activity</span><h2 id="recent-orders-heading">Recent orders</h2></div><Link to="/admin/orders" className="admin-text-link">View all <ArrowRight size={15} /></Link></header>
        {loading ? <AdminSkeleton rows={4} /> : !data?.recentOrders?.length ? <AdminEmptyState title="No recent orders" description="New orders will appear here." /> : <div className="admin-table-scroll"><table>
          <thead><tr><th>Order number</th><th>Customer</th><th className="admin-align-right">Total</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{data.recentOrders.map((order) => <tr key={order.id}>
            <td className="admin-numeric">{order.orderNumber || order.id}</td><td>{order.customerName || '—'}</td><td className="admin-align-right admin-numeric">{formatPrice(order.total)}</td><td><Badge variant={order.status} /></td><td><Link className="admin-button admin-button-ghost admin-button-sm" to={`/admin/orders/${order.id}`}>View</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </section>

      <section className="admin-card admin-attention-card" aria-labelledby="attention-heading">
        <header className="admin-card-header"><div><span className="admin-eyebrow">Operations</span><h2 id="attention-heading">Needs attention</h2></div></header>
        <div className="admin-card-body admin-attention-body">
          <Link to="/admin/orders?status=pending" className="admin-attention-link"><span>Pending orders</span><strong>{loading ? '—' : metrics.pendingOrders ?? '—'}</strong></Link>
          <Link to="/admin/reviews?status=reported" className="admin-attention-link"><span>Reported reviews</span><strong>{reportedReviews ?? '—'}</strong></Link>
          <Link to="/admin/inventory?filter=LOW%20STOCK" className="admin-attention-link"><span>Low-stock products</span><strong>{summaryAvailable ? summary.low.length : '—'}</strong></Link>
          <Link to="/admin/inventory?filter=OUT%20OF%20STOCK" className="admin-attention-link"><span>Out-of-stock products</span><strong>{summaryAvailable ? summary.out.length : '—'}</strong></Link>
          {!summaryAvailable ? <p className="admin-muted-note">Product-level stock summary is unavailable until the complete catalog is loaded.</p> : <div className="admin-low-stock-list"><h3>Five products with the least stock</h3>{summary.leastStock.length ? summary.leastStock.map((product) => <div className="admin-low-stock-row" key={product.id}><span title={product.name}>{product.name}</span><strong className="admin-numeric">{product.totalStock}</strong></div>) : <p className="admin-muted-note">No active products found.</p>}</div>}
        </div>
      </section>
    </div>
  </div>;
}
