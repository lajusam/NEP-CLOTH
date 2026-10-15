import { useState } from "react";

const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];
const starPath = "M12 2.8l2.85 5.77 6.37.93-4.61 4.5 1.09 6.35L12 17.35l-5.7 3 1.09-6.35-4.61-4.5 6.37-.93L12 2.8z";

export default function StarInput({ value = 0, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  const preview = hovered || value;
  const selectByKeyboard = (event, selected) => {
    let next = selected;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(5, selected + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(1, selected - 1);
    else return;
    event.preventDefault();
    onChange(next);
    event.currentTarget.parentElement?.querySelector(`[data-rating="${next}"]`)?.focus();
  };

  return <div className="review-star-input" role="radiogroup" aria-label="Rate this product">
    {labels.map((label, index) => {
      const rating = index + 1;
      return <button
        key={rating}
        type="button"
        role="radio"
        aria-checked={value === rating}
        aria-label={`${rating} ${rating === 1 ? "star" : "stars"} — ${label}`}
        data-rating={rating}
        tabIndex={value === rating || (!value && rating === 1) ? 0 : -1}
        disabled={disabled}
        onClick={() => onChange(rating)}
        onKeyDown={(event) => selectByKeyboard(event, rating)}
        onMouseEnter={() => setHovered(rating)}
        onMouseLeave={() => setHovered(0)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={starPath} fill={rating <= preview ? "currentColor" : "transparent"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
      </button>;
    })}
    <span className="review-star-input-label" aria-live="polite">{preview ? labels[preview - 1] : "Choose a rating"}</span>
  </div>;
}
