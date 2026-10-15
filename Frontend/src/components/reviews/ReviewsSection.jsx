import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createProductReview,
  deleteReview,
  fetchProductReviews,
  fetchReviewEligibility,
  reportReview,
  updateReview,
} from "../../lib/api";
import { useReviewsReveal } from "../../hooks/useReviewsReveal";
import ReviewDialog from "./ReviewDialog";
import ReviewEditor from "./ReviewEditor";
import StarRating from "./StarRating";
import "./reviews.css";

const REPORT_REASONS = [
  ["spam", "Spam or advertising"],
  ["abusive", "Abusive or hateful content"],
  ["personal_info", "Personal information"],
  ["not_a_review", "Not a product review"],
  ["other", "Other concern"],
];

function dateLabel(date) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export default function ReviewsSection({ product }) {
  const { user } = useAuth();
  const rootRef = useRef(null);
  const [sort, setSort] = useState("newest");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ average: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityError, setEligibilityError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");
  const [reportId, setReportId] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [reportedIds, setReportedIds] = useState(() => new Set());

  const refreshReviews = useCallback(async (nextSort = sort, nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else if (nextPage === 1) setLoading(true);
    setError("");
    try {
      const result = await fetchProductReviews(product.slug, { sort: nextSort, page: nextPage, limit: 10 });
      setSummary(result.summary);
      setTotalPages(result.totalPages);
      setItems((current) => append ? [...current, ...result.items] : result.items);
      setPage(nextPage);
    } catch (requestError) {
      setError(requestError.status === 429 ? "Too many review requests. Please wait a moment and retry." : requestError.message || "Reviews could not be loaded.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [product.slug, sort]);

  const refreshEligibility = useCallback(async () => {
    setEligibilityError("");
    try {
      setEligibility(await fetchReviewEligibility(product.slug));
    } catch (requestError) {
      setEligibilityError(requestError.status === 429 ? "Please wait a moment before checking review eligibility again." : requestError.message || "Review eligibility could not be checked.");
    }
  }, [product.slug]);

  useEffect(() => { refreshReviews(sort, 1); }, [refreshReviews, sort]);
  useEffect(() => {
    if (user) refreshEligibility();
    else {
      setEligibility({ canReview: false, reason: "login_required", myReview: null });
      setEligibilityError("");
    }
  }, [user, refreshEligibility]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useReviewsReveal(rootRef, `${loading}:${summary.count}:${items.length}`);

  const handleReviewSubmit = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      if (editMode && eligibility?.myReview?.id) {
        await updateReview(eligibility.myReview.id, values);
        setToast("Your review has been updated.");
      } else {
        await createProductReview(product.slug, values);
        setToast("Thank you. Your review has been published.");
      }
      setEditMode(false);
      await Promise.all([refreshReviews(sort, 1), refreshEligibility()]);
    } catch (requestError) {
      setFormError(requestError.status === 429
        ? "You have reached the review limit. Please try again later."
        : requestError.status === 409
          ? "You have already reviewed this product. Refresh your reviews to edit it."
          : requestError.status === 403
            ? "Only customers who received this product can write a review."
            : requestError.message || "Your review could not be saved.");
      if (requestError.status === 409 || requestError.status === 403) refreshEligibility();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!eligibility?.myReview?.id) return;
    setDeleteBusy(true);
    try {
      await deleteReview(eligibility.myReview.id);
      setDeleteOpen(false);
      setEditMode(false);
      setToast("Your review has been deleted.");
      await Promise.all([refreshReviews(sort, 1), refreshEligibility()]);
    } catch (requestError) {
      setFormError(requestError.status === 429 ? "You have reached the review limit. Please try again later." : requestError.message || "Your review could not be deleted.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmReport = async () => {
    if (!reportId) return;
    setReportBusy(true);
    try {
      await reportReview(reportId, { reason: reportReason, note: reportNote.trim() || null });
      setReportedIds((current) => new Set(current).add(reportId));
      setToast("Thank you. Your report was sent to our team.");
      setReportId(null);
      setReportNote("");
    } catch (requestError) {
      if (requestError.status === 409) {
        setReportedIds((current) => new Set(current).add(reportId));
        setToast("You have already reported this review.");
        setReportId(null);
      } else {
        setFormError(requestError.status === 429 ? "You have reached the report limit. Please try again later." : requestError.message || "This review could not be reported.");
      }
    } finally {
      setReportBusy(false);
    }
  };

  const myReview = eligibility?.myReview;
  const ratingAverage = summary.average;

  return <section id="reviews" ref={rootRef} className="reviews-section">
    <div className="reviews-container">
      <header className="reviews-heading">
        <span className="reviews-eyebrow">THE NEP CLOTH COMMUNITY</span>
        <h2>REVIEWS</h2>
      </header>

      {loading ? <div className="reviews-summary-skeleton" aria-label="Loading review summary" aria-busy="true"><span /><span /><span /></div> : <div className="reviews-summary">
        <div className="reviews-summary-score">
          {summary.count > 0 ? <><strong>{ratingAverage.toFixed(1)}</strong><StarRating value={ratingAverage} count={summary.count} /><span>BASED ON {summary.count} {summary.count === 1 ? "REVIEW" : "REVIEWS"}</span></> : <><strong>—</strong><span>NO REVIEWS YET</span></>}
        </div>
        <div className="reviews-distribution" aria-label="Review rating distribution">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = summary.distribution?.[rating] || 0;
            const percent = summary.count ? (count / summary.count) * 100 : 0;
            return <div className="review-distribution-row" key={rating}>
              <span>{rating} STAR</span>
              <span className="review-distribution-track"><span data-review-bar style={{ width: `${percent}%` }} /></span>
              <span>{count}</span>
            </div>;
          })}
        </div>
      </div>}

      <div className="reviews-list-heading">
        <h3>CUSTOMER EXPERIENCES <span>({summary.count})</span></h3>
        <label>Sort by <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort reviews"><option value="newest">Newest</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option></select></label>
      </div>

      {error && <div className="reviews-error" role="alert"><p>{error}</p><button type="button" onClick={() => refreshReviews(sort, 1)}>RETRY</button></div>}
      {loading && !items.length ? <div className="reviews-list-skeleton" aria-label="Loading reviews" aria-busy="true">{[0, 1, 2].map((item) => <div key={item}><span /><span /><span /></div>)}</div> : null}
      {!loading && !error && items.length === 0 && <div className="reviews-empty"><strong>NO REVIEWS YET</strong><p>Be the first to share your experience with this piece.</p></div>}
      <div className="reviews-list">
        {items.map((review) => {
          const isOwn = myReview?.id === review.id;
          const isExpanded = expanded.has(review.id);
          const longBody = (review.body?.length || 0) > 260;
          return <article className="review-card" data-review-reveal key={review.id}>
            <div className="review-card-top">
              <div><StarRating value={review.rating} /><span className="review-verified">VERIFIED PURCHASE</span></div>
              {!isOwn && user && <details className="review-report-menu"><summary aria-label="Review actions">•••</summary><div><button type="button" disabled={reportedIds.has(review.id)} onClick={() => { setReportId(review.id); setReportReason("spam"); }}> {reportedIds.has(review.id) ? "REPORTED" : "REPORT REVIEW"}</button></div></details>}
              {!user && <Link className="review-report-link" to="/login" state={{ from: { pathname: `/product/${product.slug}#reviews` } }}>LOG IN TO REPORT</Link>}
            </div>
            {review.title && <h4>{review.title}</h4>}
            {review.body && <><p className={`review-card-body${longBody && !isExpanded ? " is-collapsed" : ""}`}>{review.body}</p>{longBody && <button type="button" className="review-read-more" aria-expanded={isExpanded} onClick={() => setExpanded((current) => { const next = new Set(current); isExpanded ? next.delete(review.id) : next.add(review.id); return next; })}>{isExpanded ? "READ LESS" : "READ MORE"}</button>}</>}
            <footer><strong>{review.displayName}</strong><span>{dateLabel(review.createdAt)}{review.editedAt && <em> · EDITED</em>}</span></footer>
            {review.adminReply && <blockquote className="review-store-reply"><span>REPLY FROM NEP CLOTH</span><p>{review.adminReply}</p>{review.adminReplyAt && <small>{dateLabel(review.adminReplyAt)}</small>}</blockquote>}
          </article>;
        })}
      </div>
      {page < totalPages && !error && <button type="button" className="reviews-load-more" disabled={loadingMore} onClick={() => refreshReviews(sort, page + 1, true)}>{loadingMore ? "LOADING…" : "LOAD MORE REVIEWS"}</button>}

      <div className="review-write-area" data-review-reveal>
        <span className="reviews-eyebrow">YOUR EXPERIENCE MATTERS</span>
        <h3>WRITE A REVIEW</h3>
        {!user || eligibility?.reason === "login_required" ? <p className="review-eligibility-message">Log in to review this product. <Link to="/login" state={{ from: { pathname: `/product/${product.slug}#reviews` } }}>LOG IN</Link></p>
          : eligibilityError ? <div className="reviews-error" role="alert"><p>{eligibilityError}</p><button type="button" onClick={refreshEligibility}>RETRY</button></div>
            : !eligibility ? <div className="review-inline-skeleton" aria-label="Checking review eligibility" aria-busy="true" />
              : eligibility.reason === "not_purchased" ? <p className="review-eligibility-message">Only customers who received this product can write a review.</p>
                : eligibility.reason === "already_reviewed" && !editMode ? <div className="review-own-summary"><StarRating value={myReview?.rating || 0} /><p>{myReview?.title || myReview?.body || "Your verified review"}</p><div><button type="button" onClick={() => { setEditMode(true); setFormError(""); }}>EDIT REVIEW</button><button type="button" onClick={() => setDeleteOpen(true)}>DELETE REVIEW</button></div></div>
                  : eligibility.canReview || editMode ? <ReviewEditor key={`${myReview?.id || "new"}-${myReview?.editedAt || ""}`} initialReview={editMode ? myReview : null} onSubmit={handleReviewSubmit} loading={saving} error={formError} submitLabel={editMode ? "SAVE CHANGES" : "SUBMIT REVIEW"} />
                    : <p className="review-eligibility-message">Review eligibility could not be determined. Please retry.</p>}
        {editMode && <button type="button" className="review-cancel-edit" onClick={() => { setEditMode(false); setFormError(""); }}>CANCEL EDIT</button>}
      </div>
    </div>

    {toast && <div className="review-toast" role="status" aria-live="polite">{toast}</div>}
    <ReviewDialog open={Boolean(reportId)} title="REPORT THIS REVIEW" description="Your report is confidential and will be reviewed by our team." onClose={() => setReportId(null)} onConfirm={confirmReport} busy={reportBusy} confirmLabel="SEND REPORT">
      <label className="review-dialog-field">REASON<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="review-dialog-field">NOTE <span>OPTIONAL · 200 CHARACTERS MAX</span><textarea rows={3} maxLength={200} value={reportNote} onChange={(event) => setReportNote(event.target.value)} /></label>
    </ReviewDialog>
    <ReviewDialog open={deleteOpen} title="DELETE YOUR REVIEW?" description="This will permanently remove your review and its reports. This action cannot be undone." onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} busy={deleteBusy} confirmLabel="DELETE REVIEW" tone="danger" />
  </section>;
}
