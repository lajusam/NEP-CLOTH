import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import InventoryTable from '../../components/admin/InventoryTable';
import LowStockBanner from '../../components/admin/LowStockBanner';
import { fetchAdminProducts, updateAdminVariant } from '../../lib/api';

const filters = ['ALL', 'NEEDS RESTOCK', 'LOW STOCK', 'OUT OF STOCK'];

export default function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const requestedFilter = params.get('filter')?.toUpperCase().replaceAll('-', ' ') || 'ALL';
  const [filter, setFilterState] = useState(filters.includes(requestedFilter) ? requestedFilter : 'ALL');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageRef = useRef(null);
  const titleRef = useRef(null);

  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');
  const setFilter = (next) => { setFilterState(next); setParams(next === 'ALL' ? {} : { filter: next.toLowerCase().replaceAll(' ', '-') }); };

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminProducts({ page: 1, limit: 50 });
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Compute flattened variant rows
  const variantRows = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      image: p.images?.[0] || null,
      size: v.size,
      color: v.color,
      section: p.section,
      category: p.category,
      stock: v.stock,
      active: p.active,
      sku: `NEP-${p.slug.slice(0, 3).toUpperCase()}-${v.size || 'OS'}${v.color?.trim() ? `-${v.color.trim().slice(0, 3).toUpperCase()}` : ''}`,
      status: v.stock === 0 ? 'oos' : v.stock < 5 ? 'lowstock' : 'instock',
    }))
  );

  const activeRows = variantRows.filter((row) => row.active);
  const lowStockCount = new Set(activeRows.filter((r) => r.stock > 0 && r.stock < 5).map((r) => r.productId)).size;
  const outOfStockCount = new Set(activeRows.filter((r) => r.stock === 0).map((r) => r.productId)).size;
  const restockCount = new Set(activeRows.filter((r) => r.stock >= 0 && r.stock <= 4).map((r) => r.productId)).size;

  const handleStockUpdate = async (variantId, newStock) => {
    await updateAdminVariant(variantId, { stock: newStock });
    // Update local state
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) =>
          v.id === variantId ? { ...v, stock: newStock } : v
        ),
      }))
    );
  };

  return (
    <div ref={pageRef} className="px-8 py-8 pb-24">
      {/* Title */}
      <div ref={titleRef} className="mb-8">
        <span className="admin-eyebrow">Warehouse management</span>
        <h1 className="admin-page-title">Inventory</h1>
        <p className="admin-page-description">Stock controls are per variant. Attention counts show distinct active products.</p>
      </div>

      {lowStockCount > 0 && (
        <LowStockBanner count={lowStockCount} onView={() => setFilter('LOW STOCK')} />
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
          {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="admin-filter-button"
            aria-pressed={filter === f}
          >
            {f === 'ALL' ? 'All' : f === 'NEEDS RESTOCK' ? `Needs restock · ${restockCount}` : f === 'LOW STOCK' ? `Low stock · ${lowStockCount}` : `Out of stock · ${outOfStockCount}`}
          </button>
        ))}
      </div>

      <InventoryTable
        filter={filter}
        rows={variantRows}
        loading={loading}
        error={error}
        onRetry={loadInventory}
        onStockUpdate={handleStockUpdate}
      />
    </div>
  );
}
