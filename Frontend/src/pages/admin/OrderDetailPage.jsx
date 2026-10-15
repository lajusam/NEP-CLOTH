import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAdminPageEntry, useAdminSlideIn } from '../../hooks/useGSAP';
import Badge from '../../components/admin/Badge';
import { fetchAdminOrderById, updateAdminOrderStatus, formatPrice } from '../../lib/api';
import { ConfirmDialog } from '../../components/admin/ui/AdminFeedback';
import { useAdminToast } from '../../components/admin/ui/useAdminToast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const titleRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const toast = useAdminToast();

  useAdminPageEntry(pageRef);
  useAdminSlideIn(titleRef, 'left');

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusChange = async (nextStatus) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await updateAdminOrderStatus(order.id, nextStatus);
      // Update UI without full page reload
      setOrder(res.order);
      setPendingStatus(null);
      toast(`Order marked ${nextStatus}.`, 'success');
    } catch (err) {
      console.error('Failed to update order status:', err);
      setActionError(err.message || 'Status update failed');
      toast(err.message || 'Status update failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-16 text-center">
        <Loader2 size={28} className="animate-spin mx-auto text-secondary mb-3" />
        <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-secondary">
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-8 py-16">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] text-secondary hover:text-obsidian transition-colors mb-6"
        >
          <ArrowLeft size={14} /> BACK TO ORDERS
        </button>
        <div className="p-6 border border-altitude-orange/30 bg-altitude-orange/5 text-altitude-orange max-w-lg">
          <p className="font-sans text-[14px] font-medium mb-2">Order Not Found</p>
          <p className="font-sans text-[13px]">{error || 'This order does not exist.'}</p>
        </div>
      </div>
    );
  }

  const placedDate = new Date(order.createdAt).toLocaleString('en-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div ref={pageRef} className="px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] text-secondary border-b border-secondary pb-0.5 hover:text-obsidian hover:border-obsidian transition-colors mb-8 w-max cursor-pointer"
      >
        <ArrowLeft size={14} strokeWidth={1} />
        BACK TO ORDERS
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div ref={titleRef}>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
            Order Details
          </span>
          <h1 className="font-display text-[clamp(48px,6vw,80px)] leading-none tracking-tight text-obsidian uppercase">
            {order.orderNumber || order.id}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={order.status} />
          <Badge variant={order.paymentStatus} />
        </div>
      </div>
      <p className="font-mono text-[14px] text-secondary mb-8">Placed on {placedDate}</p>

      {/* Action error banner */}
      {actionError && (
        <div className="p-4 mb-6 border border-altitude-orange/30 bg-altitude-orange/5 text-altitude-orange flex items-center justify-between">
          <p className="font-sans text-[13px]">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="font-sans text-[11px] uppercase tracking-[0.2em] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="admin-order-detail-grid">
        {/* Left column */}
        <div className="space-y-6">
          {/* Status timeline with real audit trail */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-1">
              Audit Trail
            </span>
            <h3 className="font-display text-[20px] tracking-wider text-obsidian uppercase mb-5">
              Order Timeline & History
            </h3>

            <div className="space-y-4">
              {history.map((step, idx) => {
                const dateStr = step.changedAt
                  ? new Date(step.changedAt).toLocaleString('en-NP', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '';
                const isCancelled = step.status === 'cancelled';
                const isDelivered = step.status === 'delivered';

                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex flex-col items-center mt-1">
                      <div
                        className={`w-3 h-3 rounded-none flex-shrink-0 ${
                          isCancelled
                            ? 'bg-altitude-orange'
                            : isDelivered
                            ? 'bg-emerald-600'
                            : 'bg-obsidian'
                        }`}
                      />
                      {idx < history.length - 1 && (
                        <div className="w-px h-10 bg-obsidian/15 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-sans text-[12px] font-semibold uppercase tracking-[0.18em] ${
                            isCancelled ? 'text-altitude-orange' : 'text-obsidian'
                          }`}
                        >
                          {step.status}
                        </span>
                        {dateStr && (
                          <span className="font-mono text-[11px] text-secondary">
                            {dateStr}
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-[12px] text-secondary mt-0.5">
                        by <span className="text-obsidian font-medium">{step.changedBy || 'system'}</span>
                        {step.note && ` — ${step.note}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purchased items snapshot */}
          <div className="border border-obsidian/10 bg-surface-bright">
            <div className="px-6 py-4" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-1">
                Items Snapshot
              </span>
              <h3 className="font-display text-[20px] tracking-wider text-obsidian uppercase">
                Purchased Items ({order.items?.length || 0})
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                  {['', 'PRODUCT', 'SIZE', 'COLOR', 'QTY', 'UNIT PRICE', 'SUBTOTAL'].map((h) => (
                    <th key={h} className="font-sans text-[12px] tracking-[0.22em] text-secondary uppercase text-left px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b border-obsidian/5">
                    <td className="px-6 py-4">
                      <div className="w-[48px] h-[48px] bg-surface-container border border-obsidian/10 overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-sans text-[10px] text-secondary uppercase">
                            {item.productName?.slice(0, 2) || 'NP'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-sans text-[14px] text-obsidian px-6 py-4 font-medium">
                      {item.productName}
                    </td>
                    <td className="font-sans text-[13px] text-secondary px-6 py-4">{item.size}</td>
                    <td className="font-sans text-[13px] text-secondary px-6 py-4">{item.color}</td>
                    <td className="font-mono text-[14px] text-obsidian px-6 py-4">{item.quantity}</td>
                    <td className="font-mono text-[14px] text-obsidian px-6 py-4">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="font-mono text-[14px] text-obsidian px-6 py-4 font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer delivery notes — read-only */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
              Customer Delivery Notes
            </span>
            <p className="font-sans text-[14px] text-obsidian leading-relaxed">
              {order.notes || 'No notes provided.'}
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
              Customer
            </span>
            <p className="font-sans text-[15px] font-medium text-obsidian">{order.customerName}</p>
            {order.user?.email && (
              <p className="font-sans text-[13px] text-secondary mt-1">{order.user.email}</p>
            )}
            <p className="font-sans text-[13px] text-secondary mt-0.5">{order.phone}</p>
          </div>

          {/* Shipping address */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
              Shipping Address
            </span>
            <p className="font-sans text-[14px] text-obsidian leading-relaxed">{order.address}</p>
            <p className="font-sans text-[13px] text-secondary mt-1">{order.city}, Nepal</p>
            <p className="font-sans text-[12px] text-secondary mt-3 border-t border-obsidian/5 pt-2 uppercase tracking-wider">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
            </p>
          </div>

          {/* Order totals */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
              Payment Summary
            </span>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-secondary">Subtotal</span>
                <span className="font-mono text-[13px] text-obsidian">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-secondary">Shipping</span>
                <span className="font-mono text-[13px] text-obsidian">
                  {order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-obsidian/10">
                <span className="font-sans text-[12px] uppercase tracking-[0.2em] text-obsidian font-semibold">
                  TOTAL
                </span>
                <span className="font-mono text-[16px] text-obsidian font-semibold">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="pt-2">
                <Badge variant={order.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Status lifecycle actions */}
          <div className="border border-obsidian/10 bg-surface-bright p-6">
            <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">
              Lifecycle Actions
            </span>

            {actionLoading ? (
              <div className="py-4 text-center">
                <Loader2 size={20} className="animate-spin mx-auto text-secondary mb-2" />
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-secondary">
                  Updating status...
                </p>
              </div>
            ) : order.status === 'pending' ? (
              <div className="space-y-3">
                <button
                  onClick={() => setPendingStatus('confirmed')}
                  className="w-full bg-obsidian text-stark-white hover:bg-altitude-orange transition-colors font-sans text-[11px] uppercase tracking-[0.2em] py-3 cursor-pointer"
                >
                  Confirm Order
                </button>
                <button
                  onClick={() => setPendingStatus('cancelled')}
                  className="w-full border border-altitude-orange text-altitude-orange hover:bg-altitude-orange hover:text-stark-white transition-colors font-sans text-[11px] uppercase tracking-[0.2em] py-3 cursor-pointer"
                >
                  Cancel Order
                </button>
              </div>
            ) : order.status === 'confirmed' ? (
              <div className="space-y-3">
                <button
                  onClick={() => setPendingStatus('shipped')}
                  className="w-full bg-obsidian text-stark-white hover:bg-altitude-orange transition-colors font-sans text-[11px] uppercase tracking-[0.2em] py-3 cursor-pointer"
                >
                  Mark as Shipped
                </button>
                <button
                  onClick={() => setPendingStatus('cancelled')}
                  className="w-full border border-altitude-orange text-altitude-orange hover:bg-altitude-orange hover:text-stark-white transition-colors font-sans text-[11px] uppercase tracking-[0.2em] py-3 cursor-pointer"
                >
                  Cancel Order
                </button>
              </div>
            ) : order.status === 'shipped' ? (
              <div className="space-y-3">
                <button
                  onClick={() => setPendingStatus('delivered')}
                  className="w-full bg-emerald-700 text-stark-white hover:bg-emerald-800 transition-colors font-sans text-[11px] uppercase tracking-[0.2em] py-3 cursor-pointer"
                >
                  Mark as Delivered
                </button>
                <p className="font-sans text-[11px] text-secondary text-center">
                  Order in transit. Mark delivered once received and paid.
                </p>
              </div>
            ) : order.status === 'delivered' ? (
              <div className="text-center py-2">
                <CheckCircle2 size={24} className="text-emerald-600 mx-auto mb-2" />
                <p className="font-sans text-[12px] font-medium text-obsidian uppercase tracking-wider">
                  Order Delivered
                </p>
                <p className="font-sans text-[11px] text-secondary mt-1">
                  Terminal status. Payment received in full.
                </p>
              </div>
            ) : order.status === 'cancelled' ? (
              <div className="text-center py-2">
                <AlertTriangle size={24} className="text-altitude-orange mx-auto mb-2" />
                <p className="font-sans text-[12px] font-medium text-altitude-orange uppercase tracking-wider">
                  Order Cancelled
                </p>
                <p className="font-sans text-[11px] text-secondary mt-1">
                  Terminal status. Item stocks have been restored.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog open={Boolean(pendingStatus)} title={pendingStatus === 'cancelled' ? 'Cancel this order?' : `Mark order ${pendingStatus || ''}?`} description={pendingStatus === 'cancelled' ? `Cancelling ${order.orderNumber || order.id} will restore stock for all ${order.items?.length || 0} purchased variant(s). This action cannot be undone.` : `Confirm that ${order.orderNumber || order.id} should move from ${order.status} to ${pendingStatus}.`} confirmLabel={pendingStatus === 'cancelled' ? 'Confirm cancellation' : `Mark ${pendingStatus || 'order'}`} tone={pendingStatus === 'cancelled' ? 'danger' : 'primary'} busy={actionLoading} onClose={() => setPendingStatus(null)} onConfirm={() => handleStatusChange(pendingStatus)} />
    </div>
  );
}
