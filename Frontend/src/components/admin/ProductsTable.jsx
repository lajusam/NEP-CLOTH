import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, LoaderCircle, MoreHorizontal, Pencil, RotateCcw, Archive, Trash2 } from 'lucide-react';
import Badge from './Badge';
import { AdminEmptyState, AdminAlert, ConfirmDialog } from './ui/AdminFeedback';
import { useAdminToast } from './ui/useAdminToast';
import AdminButton from './ui/AdminButton';
import { fetchAdminProducts, archiveAdminProduct, restoreAdminProduct, deleteAdminProduct, formatPrice } from '../../lib/api';

export default function ProductsTable({ categoryFilter = 'ALL', sectionFilter = 'ALL', statusFilter = 'ALL', search = '', onCategories }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [partialStockFilter, setPartialStockFilter] = useState(false);
  const navigate = useNavigate();
  const toast = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const section = sectionFilter === 'MENSWEAR' ? 'men' : sectionFilter === 'WOMENSWEAR' ? 'women' : undefined;
      const category = categoryFilter === 'ALL' ? undefined : categoryFilter;
      const stockFilter = statusFilter === 'OUT OF STOCK';
      const active = stockFilter || statusFilter === 'ACTIVE' ? 'true' : statusFilter === 'ARCHIVED' ? 'false' : undefined;
      const limit = stockFilter ? 100 : 50;
      const result = await fetchAdminProducts({ section, category, active, search: search.trim() || undefined, page: stockFilter ? 1 : page, limit });
      const items = result.data || [];
      const visibleItems = stockFilter ? items.filter((p) => !(p.variants || []).some((variant) => Number(variant.stock) > 0)) : items;
      setPartialStockFilter(stockFilter && Number(result.meta?.total || 0) > items.length);
      setPagination(stockFilter
        ? { page: 1, limit: visibleItems.length || 1, total: visibleItems.length, totalPages: 1 }
        : result.meta || { page: 1, limit: 50, total: items.length, totalPages: 1 });
      if (page === 1) onCategories?.([...new Set(items.map((item) => item.category).filter(Boolean))].sort());
      setProducts(visibleItems);
    } catch (err) { setError(err.message || 'Could not load products.'); }
    finally { setLoading(false); }
  }, [categoryFilter, sectionFilter, statusFilter, search, page, onCategories]);

  useEffect(() => { setPage(1); }, [categoryFilter, sectionFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const archive = async () => {
    if (!archiveTarget) return;
    setActionId(archiveTarget.id);
    try {
      await archiveAdminProduct(archiveTarget.id);
      setProducts((items) => items.map((item) => item.id === archiveTarget.id ? { ...item, active: false } : item));
      toast('Product archived.', 'success');
    } catch (err) { toast(err.message || 'Could not archive product.', 'error'); }
    finally { setActionId(null); setArchiveTarget(null); }
  };
  const restore = async (product) => {
    setActionId(product.id);
    try {
      await restoreAdminProduct(product.id);
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, active: true } : item));
      toast('Product restored.', 'success');
    } catch (err) { toast(err.message || 'Could not restore product.', 'error'); }
    finally { setActionId(null); }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget.id);
    try {
      await deleteAdminProduct(deleteTarget.id);
      setProducts((items) => items.filter((item) => item.id !== deleteTarget.id));
      toast('Product removed from the active catalog. Order history is preserved.', 'success');
    } catch (err) { toast(err.message || 'Could not remove product.', 'error'); }
    finally { setActionId(null); setDeleteTarget(null); }
  };

  const productRows = products.map((p) => ({ ...p, totalStock: (p.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0) }));
  const actions = (p) => <div className="admin-actions">
    <AdminButton variant="secondary" size="sm" iconOnly aria-label={`Edit ${p.name}`} onClick={() => navigate(`/admin/products/${p.id}/edit`)}><Pencil size={15} /></AdminButton>
    <details className="admin-kebab"><summary aria-label={`More actions for ${p.name}`}><MoreHorizontal size={18} /></summary><div className="admin-kebab-menu">
      <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer"><Eye size={15} /> View storefront</a>
      {p.active ? <button type="button" onClick={() => setArchiveTarget(p)}><Archive size={15} /> Archive</button> : <button type="button" onClick={() => restore(p)} disabled={actionId === p.id}>{actionId === p.id ? <LoaderCircle size={15} className="admin-spin" /> : <RotateCcw size={15} />} Restore</button>}
      <button type="button" onClick={() => setDeleteTarget(p)}><Trash2 size={15} /> Delete</button>
    </div></details>
  </div>;
  const cells = (p) => [
    <div className="admin-product-cell" key="product"><div className="admin-product-thumb">{p.images?.[0] ? <img src={p.images[0]} alt="" /> : <span>{p.name?.slice(0, 2).toUpperCase() || '—'}</span>}</div><div className="min-w-0"><strong className="admin-name-truncate" title={p.name}>{p.name}</strong><small className="admin-muted-note" title={p.slug}>/{p.slug}</small></div></div>,
    <span key="category"><Badge variant={p.category || 'neutral'} className="admin-badge-outline" /></span>,<span key="section"><Badge variant={p.section} /></span>,<span key="price" className="admin-align-right admin-numeric">{formatPrice(p.price)}</span>,<span key="stock"><strong className="admin-numeric">{p.totalStock}</strong> <Badge variant={p.totalStock === 0 ? 'oos' : p.variants.some((variant) => Number(variant.stock) > 0 && Number(variant.stock) <= 4) ? 'lowstock' : 'instock'} /><small className="admin-muted-note">{p.variants?.length || 0} variants</small></span>,
    <span key="status">{!p.active ? <Badge variant="archived" label="Archived" /> : p.totalStock === 0 ? <Badge variant="oos" label="Out of stock" /> : <Badge variant="active" label="Active" />}</span>,<span key="actions">{actions(p)}</span>,
  ];

  return <>
    {error && <AdminAlert tone="error" title="Products could not be loaded">{error}<AdminButton variant="secondary" size="sm" onClick={load}>Retry</AdminButton></AdminAlert>}
    {partialStockFilter && <AdminAlert tone="warning" title="Stock filter is partial">The active catalog exceeds the 100-product cap for the out-of-stock filter, so remaining matches cannot be counted on this screen.</AdminAlert>}
    <section className="admin-table-card" aria-busy={loading}>
      {loading ? <div className="admin-loading"><LoaderCircle className="admin-spin" /> Loading products…</div> : productRows.length === 0 ? <AdminEmptyState title="No products found" description="Try changing the filters or search term." /> : <>
        <div className="admin-table-scroll"><table><thead><tr>{['Product', 'Category', 'Section', 'Price', 'Stock', 'Status', 'Actions'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{productRows.map((p) => <tr key={p.id}>{cells(p).map((content, index) => <td key={index} className={index === 0 ? 'admin-table-primary' : index === 6 ? 'admin-table-actions' : ''}>{content}</td>)}</tr>)}</tbody></table></div>
        <div className="admin-mobile-cards">{productRows.map((p) => <article className="admin-mobile-card" key={p.id}>{cells(p).map((content, index) => <div className={index === 0 ? '' : 'admin-mobile-card-row'} key={index}>{index > 0 && <span className="admin-mobile-card-label">{['', 'Category', 'Section', 'Price', 'Stock', 'Status', 'Actions'][index]}</span>}{content}</div>)}</article>)}</div>
        <div className="admin-pagination"><span>Showing {pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} products</span><div className="admin-actions"><AdminButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</AdminButton><span>Page {page} of {pagination.totalPages || 1}</span><AdminButton variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</AdminButton></div></div>
      </>}
    </section>
    <ConfirmDialog open={Boolean(archiveTarget)} title="Archive product?" description={`${archiveTarget?.name || 'This product'} will no longer appear on the storefront. You can restore it later.`} confirmLabel="Archive product" tone="danger" busy={Boolean(actionId)} onClose={() => setArchiveTarget(null)} onConfirm={archive} />
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete product?" description={`The existing DELETE endpoint archives “${deleteTarget?.name || 'this product'}” to preserve order history. The listing will be hidden and can still be restored.`} confirmLabel="Delete product" tone="danger" busy={Boolean(actionId)} onClose={() => setDeleteTarget(null)} onConfirm={remove} />
  </>;
}
