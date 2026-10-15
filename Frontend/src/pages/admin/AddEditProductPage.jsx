import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import SegmentedControl from '../../components/admin/SegmentedControl';
import ImageUploadZone from '../../components/admin/ImageUploadZone';
import AdminNumberStepper from '../../components/admin/ui/AdminNumberStepper';
import {
  fetchAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  addAdminVariant,
  updateAdminVariant,
  deleteAdminVariant,
  archiveAdminProduct,
  restoreAdminProduct,
  deleteAdminProduct,
  uploadAdminImage,
} from '../../lib/api';
import { ConfirmDialog } from '../../components/admin/ui/AdminFeedback';

const CATEGORIES = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessories', label: 'Accessories' },
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE'];

export default function AddEditProductPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const pageRef = useRef(null);
  const titleRef = useRef(null);

  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('men'); // "men" or "women"
  const [category, setCategory] = useState('tops');
  const [priceRupees, setPriceRupees] = useState(''); // In NPR
  const [images, setImages] = useState([]);
  const [isActive, setIsActive] = useState(true);

  // Variants State: [{ id, size, color, stock, _original }]
  const [variants, setVariants] = useState([
    { size: 'M', color: 'Black', stock: 10 },
  ]);
  const [initialVariants, setInitialVariants] = useState([]);

  // UI state
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text }
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load existing product if editing
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoadingProduct(true);
    setStatusMessage(null);

    fetchAdminProductById(id)
      .then((product) => {
        if (!isMounted) return;
        setName(product.name || '');
        setDescription(product.description || '');
        setSection(product.section?.toLowerCase() === 'women' ? 'women' : 'men');
        setCategory(product.category?.toLowerCase() || 'tops');
        setPriceRupees(product.price ? String(Math.round(product.price / 100)) : '');
        setImages(Array.isArray(product.images) ? product.images : []);
        setIsActive(Boolean(product.active));

        const loadedVariants = (product.variants || []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
        }));
        setVariants(loadedVariants.length > 0 ? loadedVariants : [{ size: 'M', color: 'Black', stock: 10 }]);
        setInitialVariants(loadedVariants);
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatusMessage({ type: 'error', text: err.message || 'Failed to load product details' });
      })
      .finally(() => {
        if (isMounted) setLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle image upload via backend endpoint
  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    setStatusMessage(null);
    try {
      const res = await uploadAdminImage(file);
      if (res.url) {
        setImages((prev) => [...prev, res.url]);
        setStatusMessage({ type: 'success', text: 'Image uploaded successfully' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Image upload failed' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Variants handlers
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { size: 'L', color: 'Black', stock: 5 }]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 1) {
      setStatusMessage({ type: 'error', text: 'A product must have at least one variant.' });
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Validation
  const validateForm = () => {
    if (!name.trim()) return 'Product name is required.';
    if (!description.trim()) return 'Description is required.';
    if (!category.trim()) return 'Category is required.';

    const rupees = parseFloat(priceRupees);
    if (isNaN(rupees) || rupees <= 0) {
      return 'Price must be a positive number in NPR.';
    }

    if (variants.length === 0) {
      return 'At least one variant is required.';
    }

    // Check duplicate size+color
    const seen = new Set();
    for (const v of variants) {
      if (!v.size.trim() || !v.color.trim()) {
        return 'All variants must have size and color specified.';
      }
      const stockNum = parseInt(v.stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        return `Stock for ${v.size} / ${v.color} must be an integer >= 0.`;
      }
      const key = `${v.size.trim().toLowerCase()}_${v.color.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return `Duplicate variant: size "${v.size}" and color "${v.color}" is duplicated.`;
      }
      seen.add(key);
    }

    return null;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const error = validateForm();
    if (error) {
      setStatusMessage({ type: 'error', text: error });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const priceInPaisa = Math.round(parseFloat(priceRupees) * 100);

    try {
      if (isEdit) {
        // 1. Update product base fields
        await updateAdminProduct(id, {
          name: name.trim(),
          description: description.trim(),
          section,
          category,
          price: priceInPaisa,
          images,
          active: isActive,
        });

        // 2. Sync variants
        // Deleted variants
        const currentVariantIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
        for (const initial of initialVariants) {
          if (!currentVariantIds.has(initial.id)) {
            try {
              await deleteAdminVariant(initial.id);
            } catch (delErr) {
              console.warn('Could not delete variant:', delErr.message);
            }
          }
        }

        // Updated or Added variants
        for (const v of variants) {
          const stockNum = parseInt(v.stock, 10);
          if (v.id) {
            await updateAdminVariant(v.id, {
              size: v.size.trim(),
              color: v.color.trim(),
              stock: stockNum,
            });
          } else {
            await addAdminVariant(id, {
              size: v.size.trim(),
              color: v.color.trim(),
              stock: stockNum,
            });
          }
        }

        setStatusMessage({ type: 'success', text: 'Product updated successfully.' });
        setTimeout(() => navigate('/admin/products'), 800);
      } else {
        // Create new product
        await createAdminProduct({
          name: name.trim(),
          description: description.trim(),
          section,
          category,
          price: priceInPaisa,
          images,
          variants: variants.map((v) => ({
            size: v.size.trim(),
            color: v.color.trim(),
            stock: parseInt(v.stock, 10),
          })),
        });

        setStatusMessage({ type: 'success', text: 'Product created and published successfully!' });
        setTimeout(() => navigate('/admin/products'), 800);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle archive/restore from editor
  const handleToggleArchive = async () => {
    if (!id) return;
    setSaving(true);
    try {
      if (isActive) {
        await archiveAdminProduct(id);
        setIsActive(false);
        setStatusMessage({ type: 'success', text: 'Product archived.' });
      } else {
        await restoreAdminProduct(id);
        setIsActive(true);
        setStatusMessage({ type: 'success', text: 'Product restored to active catalog.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update archive status' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deleteAdminProduct(id);
      setDeleteConfirmOpen(false);
      navigate('/admin/products');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove product from the catalog.' });
    } finally { setSaving(false); }
  };

  // Input styles
  const inputClass =
    'bg-transparent border-b border-obsidian/20 text-obsidian font-sans text-[14px] px-0 py-3 w-full focus:border-obsidian focus:outline-none transition-colors duration-200';
  const monoInputClass =
    'bg-transparent border-b border-obsidian/20 text-obsidian font-mono text-[14px] px-0 py-3 w-full focus:border-obsidian focus:outline-none transition-colors duration-200';
  const labelClass = 'font-sans text-[12px] uppercase tracking-[0.22em] text-secondary mb-2 block';

  if (loadingProduct) {
    return (
      <div className="px-8 py-20 flex items-center justify-center gap-3 text-secondary font-sans text-[12px] uppercase tracking-[0.2em]">
        <Loader2 size={20} className="animate-spin text-obsidian" />
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="px-8 py-8 pb-32">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/products')}
        className="flex items-center gap-2 text-secondary hover:text-obsidian font-sans text-[11px] uppercase tracking-[0.2em] mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Products
      </button>

      {/* Top title */}
      <div ref={titleRef} className="mb-6">
        <span className="admin-eyebrow">
          Catalog Management
        </span>
        <h1 className="admin-page-title">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 border flex items-center gap-3 font-sans text-[13px] ${
            statusMessage.type === 'success'
              ? 'border-obsidian/20 bg-surface-container text-obsidian'
              : 'border-altitude-orange/30 bg-altitude-orange/5 text-altitude-orange'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-obsidian shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-altitude-orange shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Left Column: Product Information & Variants */}
          <div className="space-y-8">
            {/* Base info */}
            <div className="space-y-6">
              <div><span className="admin-eyebrow">Basic information</span><h2 className="admin-form-heading">Product details</h2></div>
              <div>
                <label className={labelClass}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concrete Bomber Jacket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe craftsmanship, fit, fabric, and styling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent border-b border-obsidian/20 text-obsidian font-editorial text-[15px] leading-[1.8] px-0 py-3 w-full focus:border-obsidian focus:outline-none transition-colors duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Section / Department</label>
                  <SegmentedControl
                    options={['MENSWEAR', 'WOMENSWEAR']}
                    value={section === 'women' ? 'WOMENSWEAR' : 'MENSWEAR'}
                    onChange={(val) => setSection(val === 'WOMENSWEAR' ? 'women' : 'men')}
                  />
                </div>

                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass + ' appearance-none cursor-pointer'}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-obsidian text-stark-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Variants Editor */}
            <div className="border-t border-obsidian/10 pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-1">
                    Inventory & Sizes
                  </span>
                  <h3 className="font-display text-[24px] uppercase text-obsidian">
                    Product Variants
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="border border-obsidian text-obsidian font-sans text-[11px] uppercase tracking-[0.2em] px-4 py-2 hover:bg-obsidian hover:text-stark-white transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Add Variant Row
                </button>
              </div>

              <div className="border border-obsidian/10 bg-surface-bright overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                      <th className="font-sans text-[11px] tracking-[0.2em] text-secondary uppercase px-4 py-3">
                        Size
                      </th>
                      <th className="font-sans text-[11px] tracking-[0.2em] text-secondary uppercase px-4 py-3">
                        Color
                      </th>
                      <th className="font-sans text-[11px] tracking-[0.2em] text-secondary uppercase px-4 py-3 w-32">
                        Stock Qty
                      </th>
                      <th className="font-sans text-[11px] tracking-[0.2em] text-secondary uppercase px-4 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={v.id || i} className="border-b border-obsidian/5">
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            list={`sizes-${i}`}
                            value={v.size}
                            onChange={(e) => handleVariantChange(i, 'size', e.target.value.toUpperCase())}
                            placeholder="e.g. M"
                            className="w-full font-mono text-[13px] bg-transparent border-b border-obsidian/10 focus:border-obsidian outline-none py-1"
                          />
                          <datalist id={`sizes-${i}`}>
                            {STANDARD_SIZES.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => handleVariantChange(i, 'color', e.target.value)}
                            placeholder="e.g. Charcoal"
                            className="w-full font-sans text-[13px] bg-transparent border-b border-obsidian/10 focus:border-obsidian outline-none py-1"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <AdminNumberStepper label={`Stock for variant ${v.size} ${v.color}`} min={0} value={v.stock} onChange={(value) => handleVariantChange(i, 'stock', value)} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(i)}
                            className="text-secondary hover:text-altitude-orange p-1.5 transition-colors"
                            title="Remove variant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Media, Pricing & Status */}
          <div className="space-y-6">
            {/* Media Upload */}
            <div>
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-2">
                Images
              </span>
              <ImageUploadZone
                images={images}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploadingImage}
              />
            </div>

            {/* Pricing (Rupees in UI, paisa in backend) */}
            <div className="border-t border-obsidian/10 pt-6">
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
                Pricing (NPR)
              </span>
              <div className="space-y-4">
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.2em] text-secondary mb-1 block">
                    Retail Price (NPR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[13px] text-secondary">
                      NPR
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      placeholder="e.g. 4500"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(e.target.value)}
                      className={monoInputClass + ' pl-12'}
                    />
                  </div>
                  {priceRupees && !isNaN(Number(priceRupees)) && (
                    <p className="font-mono text-[11px] text-secondary/70 mt-1">
                      = {Math.round(Number(priceRupees) * 100).toLocaleString()} Paisa
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Status & Visibility */}
            <div className="border-t border-obsidian/10 pt-6">
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
                Publication Status
              </span>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-[16px] h-[16px] border flex items-center justify-center ${
                      isActive ? 'border-obsidian bg-obsidian' : 'border-obsidian/25'
                    }`}
                  >
                    {isActive && <div className="w-[8px] h-[8px] bg-stark-white" />}
                  </div>
                  <div>
                    <span className="font-sans text-[13px] uppercase tracking-[0.15em] text-obsidian block">
                      Active
                    </span>
                    <span className="font-sans text-[11px] text-secondary">
                      Visible in storefront browsing & search
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="activeStatus"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="hidden"
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-[16px] h-[16px] border flex items-center justify-center ${
                      !isActive ? 'border-obsidian bg-obsidian' : 'border-obsidian/25'
                    }`}
                  >
                    {!isActive && <div className="w-[8px] h-[8px] bg-stark-white" />}
                  </div>
                  <div>
                    <span className="font-sans text-[13px] uppercase tracking-[0.15em] text-obsidian block">
                      Archived
                    </span>
                    <span className="font-sans text-[11px] text-secondary">
                      Hidden from storefront, preserved in database
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="activeStatus"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
          <div className="admin-sticky-actions">
            <span className="admin-unsaved-note">Changes are unsaved until you save.</span>
          {isEdit ? (
            <div className="admin-danger-zone"><span>Danger zone</span><button
              type="button"
              disabled={saving}
              onClick={handleToggleArchive}
              className="border border-altitude-orange text-altitude-orange font-sans text-[12px] uppercase tracking-[0.2em] px-6 py-3.5 bg-transparent hover:bg-altitude-orange hover:text-stark-white transition-all duration-300 disabled:opacity-50"
            >
              {isActive ? 'Archive Product' : 'Restore Product'}
            </button><button type="button" disabled={saving} onClick={() => setDeleteConfirmOpen(true)} className="admin-button admin-button-danger admin-button-md"><Trash2 size={16} /> Delete product</button></div>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="border border-obsidian text-obsidian font-sans text-[12px] uppercase tracking-[0.2em] px-6 py-3.5 bg-transparent hover:bg-surface-dim transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="bg-obsidian text-stark-white font-sans text-[12px] uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-altitude-orange transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin text-stark-white" />}
              {isEdit ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </div>
      </form>
      <ConfirmDialog open={deleteConfirmOpen} title="Delete product?" description="The existing DELETE endpoint removes this product from the active catalog by archiving it; order history is preserved and the product remains restorable." confirmLabel="Delete product" tone="danger" busy={saving} onClose={() => setDeleteConfirmOpen(false)} onConfirm={handleDelete} />
    </div>
  );
}
