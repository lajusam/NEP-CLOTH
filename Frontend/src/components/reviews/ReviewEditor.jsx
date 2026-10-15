import { useEffect, useState } from "react";
import StarInput from "./StarInput";

export default function ReviewEditor({ initialReview, onSubmit, loading, error, submitLabel = "SUBMIT REVIEW" }) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [title, setTitle] = useState(initialReview?.title || "");
  const [body, setBody] = useState(initialReview?.body || "");

  useEffect(() => {
    setRating(initialReview?.rating || 0);
    setTitle(initialReview?.title || "");
    setBody(initialReview?.body || "");
  }, [initialReview?.id, initialReview?.editedAt, initialReview?.createdAt]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating < 1 || rating > 5 || loading) return;
    onSubmit({ rating, title: title.trim() || null, body: body.trim() || null });
  };

  return <form className="review-editor" onSubmit={handleSubmit}>
    <div className="review-editor-field">
      <span className="review-field-label">YOUR RATING <span aria-hidden="true">*</span></span>
      <StarInput value={rating} onChange={setRating} disabled={loading} />
    </div>
    <div className="review-editor-field">
      <label className="review-field-label" htmlFor="review-title">TITLE <span className="review-optional">OPTIONAL</span></label>
      <input id="review-title" value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} disabled={loading} />
      <span className="review-character-count">{title.length}/80</span>
    </div>
    <div className="review-editor-field">
      <label className="review-field-label" htmlFor="review-body">YOUR EXPERIENCE <span className="review-optional">OPTIONAL</span></label>
      <textarea id="review-body" rows={4} value={body} maxLength={1000} onChange={(event) => setBody(event.target.value)} disabled={loading} />
      <span className="review-character-count">{body.length}/1000</span>
    </div>
    {error && <p className="review-inline-error" role="alert">{error}</p>}
    <button type="submit" className="review-submit-button" disabled={rating < 1 || loading}>
      {loading ? "SAVING…" : submitLabel}
    </button>
  </form>;
}
