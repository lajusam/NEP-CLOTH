import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ReviewDialog from "../components/reviews/ReviewDialog";
import ReviewEditor from "../components/reviews/ReviewEditor";
import StarRating from "../components/reviews/StarRating";
import { deleteReview, fetchMyReviews, updateReview } from "../lib/api";
import "../components/reviews/reviews.css";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setReviews(await fetchMyReviews()); }
    catch (requestError) { setError(requestError.message || "Your reviews could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const save = async (review, values) => {
    setBusy(true);
    setError("");
    try {
      const result = await updateReview(review.id, values);
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, ...result.data } : item));
      setEditingId(null);
      setToast("Your review has been updated.");
    } catch (requestError) {
      setError(requestError.status === 429 ? "You have reached the review limit. Please try again later." : requestError.message || "Your review could not be saved.");
    } finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteReview(deleting.id);
      setReviews((current) => current.filter((review) => review.id !== deleting.id));
      setDeleting(null);
      setEditingId(null);
      setToast("Your review has been deleted.");
    } catch (requestError) {
      setError(requestError.status === 429 ? "You have reached the review limit. Please try again later." : requestError.message || "Your review could not be deleted.");
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen flex flex-col bg-white">
    <main className="my-reviews-page reviews-section flex-1">
      <div className="reviews-container">
        <header className="reviews-heading"><div><span className="reviews-eyebrow">CLIENT PROFILE</span><h1>MY REVIEWS</h1></div></header>
        {error && <div className="reviews-error" role="alert"><p>{error}</p><button type="button" onClick={load}>RETRY</button></div>}
        {loading ? <div className="reviews-list-skeleton" aria-label="Loading your reviews" aria-busy="true">{[0, 1, 2].map((id) => <div key={id}><span /><span /><span /></div>)}</div>
          : !reviews.length ? <div className="reviews-empty"><strong>NO REVIEWS YET</strong><p>Your reviews of pieces you’ve received will appear here.</p><Link to="/men" className="my-reviews-shop-link">EXPLORE THE COLLECTION</Link></div>
            : <div className="my-reviews-list">{reviews.map((review) => <article className="my-review-card" key={review.id}>
              <Link className="my-review-product" to={`/product/${review.product.slug}`}>
                {review.product.thumbnail ? <img src={review.product.thumbnail} alt="" loading="lazy" /> : <span className="my-review-image-placeholder" aria-hidden="true">NC</span>}
                <span><strong>{review.product.name}</strong><small>VIEW PRODUCT →</small></span>
              </Link>
              <div className="my-review-content"><div className="my-review-meta"><StarRating value={review.rating} /><span>{formatDate(review.createdAt)}{review.editedAt && " · EDITED"}</span>{review.status === "hidden" && <span className="my-review-hidden">HIDDEN</span>}</div>
                {review.title && <h2>{review.title}</h2>}{review.body && <p>{review.body}</p>}
                {editingId === review.id ? <ReviewEditor initialReview={review} onSubmit={(values) => save(review, values)} loading={busy} error={error} submitLabel="SAVE CHANGES" />
                  : <div className="my-review-actions"><button type="button" onClick={() => { setEditingId(review.id); setError(""); }}>EDIT</button><button type="button" onClick={() => setDeleting(review)}>DELETE</button></div>}
              </div>
            </article>)}</div>}
      </div>
    </main>
    <Footer />
    {toast && <div className="review-toast" role="status" aria-live="polite">{toast}</div>}
    <ReviewDialog open={Boolean(deleting)} title="DELETE YOUR REVIEW?" description="This will permanently remove the review and its reports." onClose={() => setDeleting(null)} onConfirm={confirmDelete} busy={busy} confirmLabel="DELETE REVIEW" tone="danger" />
  </div>;
}
