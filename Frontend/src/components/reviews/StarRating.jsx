import { useId } from "react";

const starPath = "M12 2.8l2.85 5.77 6.37.93-4.61 4.5 1.09 6.35L12 17.35l-5.7 3 1.09-6.35-4.61-4.5 6.37-.93L12 2.8z";

export default function StarRating({ value, count, className = "" }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const id = useId().replace(/:/g, "");
  const label = Number.isFinite(count)
    ? `Rated ${rating.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`
    : `${rating.toFixed(1)} out of 5`;

  return <span className={`review-stars ${className}`} role="img" aria-label={label}>
    {Array.from({ length: 5 }, (_, index) => {
      const fill = Math.max(0, Math.min(1, rating - index));
      const gradientId = `${id}-star-${index}`;
      return <svg key={index} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {fill > 0 && fill < 1 && <defs><linearGradient id={gradientId}><stop offset={`${fill * 100}%`} stopColor="currentColor" /><stop offset={`${fill * 100}%`} stopColor="transparent" /></linearGradient></defs>}
        <path d={starPath} fill={fill === 1 ? "currentColor" : fill === 0 ? "transparent" : `url(#${gradientId})`} stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>;
    })}
  </span>;
}
