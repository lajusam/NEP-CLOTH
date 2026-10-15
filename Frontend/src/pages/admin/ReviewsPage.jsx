import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Flag, MessageSquare, MoreHorizontal, RefreshCw, Search, Trash2, X } from 'lucide-react';
import StarRating from '../../components/reviews/StarRating';
import AdminButton from '../../components/admin/ui/AdminButton';
import AdminInput from '../../components/admin/ui/AdminInput';
import { AdminAlert, AdminEmptyState, AdminSkeleton, ConfirmDialog } from '../../components/admin/ui/AdminFeedback';
import { useAdminToast } from '../../components/admin/ui/useAdminToast';
import { deleteAdminReview, fetchAdminReviewById, fetchAdminReviews, fetchAdminReviewSummary, hideAdminReview, removeReviewReply, replyToReview, unhideAdminReview } from '../../lib/api';

const PAGE_SIZE = 20;
const FILTERS = [
  { id: 'all', label: 'All reviews' },
  { id: 'published', label: 'Published' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'reported', label: 'Reported' },
];

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function ReviewDetail({ review, initialMode = '', busy, onClose, onHide, onUnhide, onDelete, onReply, onRemoveReply }) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState('');
  const [reply, setReply] = useState(review.adminReply || '');
  const [mode, setMode] = useState(initialMode);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previous = document.activeElement;
    const controls = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], summary')];
    controls()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy && mode !== 'delete') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || mode === 'delete') return;
      const items = controls();
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [busy, mode, onClose]);

  const run = async (action) => {
    setLocalError('');
    try { await action(); setMode(''); }
    catch (error) { setLocalError(error.message || 'That action could not be completed.'); }
  };

  return <div className="admin-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section ref={dialogRef} className="admin-review-detail" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
      <header className="admin-review-detail-header"><div><span className="admin-eyebrow">Customer review · {dateLabel(review.createdAt)}</span><h2 id="review-detail-title">{review.product?.name || 'Product review'}</h2></div><button type="button" className="admin-icon-control" onClick={onClose} aria-label="Close review details"><X size={18} /></button></header>
      {localError && <AdminAlert tone="error" title="Action failed">{localError}</AdminAlert>}
      <div className="admin-review-detail-content">
        <section className="admin-review-detail-card">
          <div className="admin-review-detail-rating"><StarRating value={review.rating} /><strong>{review.rating} / 5</strong><span className={`admin-review-status ${review.status}`}>{review.status}</span></div>
          <h3>{review.title || 'Customer review'}</h3><p className="admin-review-body">{review.body}</p>
          {review.hiddenReason && <p className="admin-review-note"><strong>Hidden reason:</strong> {review.hiddenReason}</p>}
          <div className="admin-review-customer"><strong>{review.customer?.name || 'Customer'}</strong><span>{review.customer?.email || '—'}</span><span>Verified purchase: {review.orderNumber || 'Delivered order confirmed'}</span></div>
          {review.adminReply && <div className="admin-review-reply"><strong>Store reply</strong><p>{review.adminReply}</p><small>{dateLabel(review.adminReplyAt)}</small></div>}
        </section>

        <section className="admin-review-detail-card"><h3>Reports ({review.reports?.length || 0})</h3>{review.reports?.length ? review.reports.map((report, index) => <div className="admin-review-report" key={`${report.createdAt}-${index}`}><strong>{report.reason}</strong>{report.note && <p>{report.note}</p>}<small>{report.customer?.name || report.customer?.email || 'Customer'} · {dateLabel(report.createdAt)}</small></div>) : <p className="admin-muted-note">No customer reports on this review.</p>}</section>

        {mode === 'reply' ? <form className="admin-review-action-form" onSubmit={(event) => { event.preventDefault(); if (!reply.trim()) return setLocalError('Enter a reply before saving.'); void run(() => onReply(reply)); }}><label htmlFor="admin-review-reply">Store reply</label><textarea id="admin-review-reply" maxLength={600} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a helpful, professional response" /><small>{reply.length}/600 characters · plain text only</small><div className="admin-actions"><AdminButton variant="secondary" onClick={() => setMode('')} disabled={busy}>Cancel</AdminButton><AdminButton type="submit" loading={busy}>Save reply</AdminButton></div></form> : null}
        {mode === 'hide' ? <form className="admin-review-action-form" onSubmit={(event) => { event.preventDefault(); if (!reason.trim()) return setLocalError('Add a moderation reason.'); void run(() => onHide(reason)); }}><label htmlFor="admin-review-hide-reason">Reason for hiding</label><textarea id="admin-review-hide-reason" maxLength={200} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this review is hidden" /><small>{reason.length}/200 characters · plain text, no links</small><div className="admin-actions"><AdminButton variant="secondary" onClick={() => setMode('')} disabled={busy}>Cancel</AdminButton><AdminButton type="submit" variant="danger" loading={busy}>Hide review</AdminButton></div></form> : null}
      </div>
      {mode !== 'reply' && mode !== 'hide' && <footer className="admin-review-detail-actions">
        {review.status === 'published' ? <AdminButton variant="secondary" icon={EyeOff} onClick={() => setMode('hide')} disabled={busy}>Hide</AdminButton> : <AdminButton variant="secondary" icon={Eye} onClick={() => void run(onUnhide)} loading={busy}>Publish</AdminButton>}
        <AdminButton variant="secondary" icon={MessageSquare} onClick={() => setMode('reply')} disabled={busy}>{review.adminReply ? 'Edit reply' : 'Reply'}</AdminButton>
        {review.adminReply && <AdminButton variant="ghost" onClick={() => void run(onRemoveReply)} disabled={busy}>Remove reply</AdminButton>}
        <AdminButton variant="danger" icon={Trash2} onClick={() => setMode('delete')} disabled={busy}>Delete</AdminButton>
      </footer>}
      <ConfirmDialog open={mode === 'delete'} title="Delete this review?" description="This permanently removes the review and its reports. This action cannot be undone." confirmLabel="Delete review" tone="danger" busy={busy} onClose={() => setMode('')} onConfirm={() => void run(onDelete)} />
    </section>
  </div>;
}

export default function ReviewsPage() {
  const notify = useAdminToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState(() => FILTERS.some((filter) => filter.id === searchParams.get('status')) ? searchParams.get('status') : 'all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedMode, setSelectedMode] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [list, counts] = await Promise.all([
        fetchAdminReviews({ status, search, rating, page, limit: PAGE_SIZE }),
        fetchAdminReviewSummary(),
      ]);
      setResult(list); setSummary(counts);
    } catch (requestError) { setError(requestError.message || 'Could not load reviews.'); }
    finally { setLoading(false); }
  }, [status, search, rating, page, refreshKey]);
  useEffect(() => { void load(); }, [load]);

  const refresh = () => setRefreshKey((value) => value + 1);
  const openReview = async (id, mode = '') => {
    try { setSelected(await fetchAdminReviewById(id)); setSelectedMode(mode); }
    catch (requestError) { notify(requestError.message || 'Could not load review details.', 'error'); }
  };
  const perform = async (action, message) => {
    setActionBusy(true);
    try { await action(); notify(message); setSelected(null); refresh(); }
    catch (requestError) { notify(requestError.message || 'Review action failed.', 'error'); throw requestError; }
    finally { setActionBusy(false); }
  };

  const countFor = (filter) => filter === 'all' ? (summary?.published || 0) + (summary?.hidden || 0) : summary?.[filter];
  const items = result?.data || [];

  return <div className="px-8 py-8 admin-reviews-page">
    <header className="admin-page-header"><div><span className="admin-eyebrow">Customer experience</span><h1>Product reviews</h1><p>Review verified-purchase feedback, respond to customers, and moderate reports.</p></div><div className="admin-page-actions"><AdminButton variant="secondary" icon={RefreshCw} onClick={refresh}>Refresh</AdminButton></div></header>
    <AdminAlert tone="info" title="Fair moderation">Hide only spam, abuse, or personal information. Hiding honest negative reviews is misleading to customers.</AdminAlert>
    {error && <AdminAlert tone="error" title="Reviews unavailable" action={<AdminButton size="sm" variant="secondary" onClick={refresh}>Retry</AdminButton>}>{error}</AdminAlert>}
    <section className="admin-review-stats" aria-label="Review totals">
      <div><span>Published</span><strong>{summary?.published ?? '—'}</strong></div><div><span>Hidden</span><strong>{summary?.hidden ?? '—'}</strong></div><div className={summary?.reported ? 'has-reports' : ''}><span>With reports</span><strong>{summary?.reported ?? '—'}</strong></div>
    </section>
    <div className="admin-segmented admin-review-tabs" role="group" aria-label="Filter reviews">{FILTERS.map((filter) => <button type="button" key={filter.id} aria-pressed={status === filter.id} onClick={() => { setStatus(filter.id); setSearchParams(filter.id === 'all' ? {} : { status: filter.id }); setPage(1); }}>{filter.label}{countFor(filter.id) !== undefined && <span>{countFor(filter.id)}</span>}</button>)}</div>
    <form className="admin-toolbar admin-review-toolbar" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}>
      <div className="admin-toolbar-controls"><AdminInput label="Search reviews" name="review-search" icon={Search} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Review, product, or customer" /><div className="admin-field"><label htmlFor="review-rating-filter">Rating</label><select id="review-rating-filter" value={rating} onChange={(event) => { setRating(event.target.value); setPage(1); }}><option value="all">Any rating</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></div><AdminButton type="submit" icon={Search}>Search</AdminButton>{(search || rating !== 'all') && <AdminButton variant="ghost" onClick={() => { setSearchInput(''); setSearch(''); setRating('all'); setPage(1); }}>Clear</AdminButton>}</div>
    </form>
    <section className="admin-table-card" aria-label="Reviews list">
      {loading ? <AdminSkeleton rows={5} /> : items.length === 0 ? <AdminEmptyState title="No reviews found" description={status === 'reported' ? 'There are no reported reviews matching these filters.' : 'Customer reviews will appear here after a verified purchase.'} /> : <>
        <div className="admin-table-scroll"><table><thead><tr><th>Review</th><th>Product</th><th>Customer</th><th>Rating</th><th>Submitted</th><th>Status</th><th>Reports</th><th className="admin-table-actions">Actions</th></tr></thead><tbody>{items.map((review) => <tr key={review.id}>
          <td className="admin-review-list-primary"><button type="button" className="admin-review-open" onClick={() => void openReview(review.id)} title={review.body || review.title || 'View review'}><strong>{review.title || 'Review details'}</strong><span>{review.body || ''}</span></button></td>
          <td><span className="admin-review-product-cell">{review.product?.thumbnail && <img src={review.product.thumbnail} alt="" loading="lazy" />}<span>{review.product?.name || '—'}</span></span></td><td><span className="admin-review-customer-cell"><strong>{review.customer?.name || 'Customer'}</strong><small>{review.customer?.email || '—'}</small></span></td><td><StarRating value={review.rating} /></td><td>{dateLabel(review.createdAt)}</td><td><span className={`admin-review-status ${review.status}`}>{review.status}</span></td><td>{review.reportCount ? <span className="admin-review-report-count"><Flag size={14} />{review.reportCount}</span> : '—'}</td><td className="admin-table-actions"><div className="admin-actions"><AdminButton size="sm" variant="secondary" onClick={() => void openReview(review.id)}>View</AdminButton><details className="admin-kebab"><summary aria-label="More review actions"><MoreHorizontal size={18} /></summary><div className="admin-kebab-menu"><button type="button" onClick={() => void openReview(review.id)}><Eye size={15} />View details</button><button type="button" onClick={() => void openReview(review.id, review.status === 'published' ? 'hide' : 'unhide')}>{review.status === 'published' ? <><EyeOff size={15} />Hide</> : <><Eye size={15} />Unhide</>}</button><button type="button" onClick={() => void openReview(review.id, 'reply')}><MessageSquare size={15} />Reply</button><button type="button" onClick={() => void openReview(review.id, 'delete')}><Trash2 size={15} />Delete</button></div></details></div></td>
        </tr>)}</tbody></table></div>
        <div className="admin-mobile-cards">{items.map((review) => <article className="admin-mobile-card" key={review.id}><div className="admin-mobile-card-row"><span className={`admin-review-status ${review.status}`}>{review.status}</span><span>{dateLabel(review.createdAt)}</span></div><span className="admin-review-product-cell">{review.product?.thumbnail && <img src={review.product.thumbnail} alt="" loading="lazy" />}<strong>{review.product?.name || 'Product'}</strong></span><button type="button" className="admin-review-open" onClick={() => void openReview(review.id)}><StarRating value={review.rating} /><strong>{review.title || 'Review details'}</strong><span>{review.body}</span></button><div className="admin-mobile-card-row"><span className="admin-mobile-card-label">{review.customer?.name || review.customer?.email || 'Customer'}</span>{review.reportCount > 0 && <span className="admin-review-report-count"><Flag size={14} />{review.reportCount}</span>}</div><AdminButton size="sm" variant="secondary" onClick={() => void openReview(review.id)}>View and manage</AdminButton></article>)}</div>
        <footer className="admin-pagination"><span>{result.total ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.total)} of ${result.total}` : 'No reviews'}</span><div className="admin-actions"><AdminButton size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</AdminButton><span>Page {page} of {result.totalPages || 1}</span><AdminButton size="sm" variant="secondary" iconRight={ChevronRight} disabled={page >= (result.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</AdminButton></div></footer>
      </>}
    </section>
    {selected && <ReviewDetail key={`${selected.id}-${selectedMode}`} review={selected} initialMode={selectedMode} busy={actionBusy} onClose={() => setSelected(null)}
      onHide={(reason) => perform(() => hideAdminReview(selected.id, reason), 'Review hidden.')}
      onUnhide={() => perform(() => unhideAdminReview(selected.id), 'Review published.')}
      onDelete={() => perform(() => deleteAdminReview(selected.id), 'Review deleted.')}
      onReply={(reply) => perform(() => replyToReview(selected.id, reply), 'Store reply saved.')}
      onRemoveReply={() => perform(() => removeReviewReply(selected.id), 'Store reply removed.')} />}
  </div>;
}
