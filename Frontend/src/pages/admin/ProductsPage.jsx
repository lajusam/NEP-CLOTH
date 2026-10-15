import { useCallback, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import ProductsTable from '../../components/admin/ProductsTable';
import AdminButton from '../../components/admin/ui/AdminButton';
import AdminInput from '../../components/admin/ui/AdminInput';

export default function ProductsPage() {
  const [category, setCategory] = useState('ALL');
  const [section, setSection] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const titleRef = useRef(null);
  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');
  const updateCategories = useCallback((values) => setCategories((old) => old.join('|') === values.join('|') ? old : values), []);

  return <div ref={pageRef} className="px-8 py-8">
    <header className="admin-page-header"><div ref={titleRef}><span className="admin-eyebrow">Catalog</span><h1 className="admin-page-title">Products</h1><p>Manage product listings, visibility, and catalog details.</p></div><div className="admin-page-actions"><AdminButton variant="primary" icon={<Plus size={17} />} onClick={() => navigate('/admin/products/new')}>Add product</AdminButton></div></header>
    <section className="admin-toolbar" aria-label="Product filters"><div className="admin-toolbar-controls">
      <AdminInput label="Search products" icon={Search} placeholder="Name or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="admin-field"><label htmlFor="product-section-filter">Section</label><select id="product-section-filter" value={section} onChange={(e) => setSection(e.target.value)}><option value="ALL">All sections</option><option value="WOMENSWEAR">Women</option><option value="MENSWEAR">Men</option></select></div>
      <div className="admin-field"><label htmlFor="product-category-filter">Category</label><select id="product-category-filter" value={categories.includes(category) ? category : 'ALL'} onChange={(e) => setCategory(e.target.value)}><option value="ALL">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
      <div className="admin-field"><label htmlFor="product-status-filter">Status</label><select id="product-status-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="OUT OF STOCK">Out of stock</option><option value="ARCHIVED">Archived</option></select></div>
    </div></section>
    {(search || section !== 'ALL' || category !== 'ALL' || status !== 'ALL') && <div className="admin-filter-chips" aria-label="Active filters">{search && <button className="admin-filter-chip" onClick={() => setSearch('')}>Search: {search} ×</button>}{section !== 'ALL' && <button className="admin-filter-chip" onClick={() => setSection('ALL')}>Section: {section} ×</button>}{category !== 'ALL' && <button className="admin-filter-chip" onClick={() => setCategory('ALL')}>Category: {category} ×</button>}{status !== 'ALL' && <button className="admin-filter-chip" onClick={() => setStatus('ALL')}>Status: {status} ×</button>}<button className="admin-button admin-button-ghost admin-button-sm" onClick={() => { setSearch(''); setSection('ALL'); setCategory('ALL'); setStatus('ALL'); }}>Clear all</button></div>}
    <ProductsTable categoryFilter={category} sectionFilter={section} statusFilter={status} search={search} onCategories={updateCategories} />
  </div>;
}
