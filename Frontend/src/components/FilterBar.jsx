export default function FilterBar({ categories, activeFilter, onFilterChange }) {
  return (
    <div className="w-full flex justify-center mb-14 px-6 md:px-20">
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange(cat)}
            className={`font-sans text-[11px] uppercase tracking-[0.22em] px-4 py-2 transition-colors duration-300 border ${
              activeFilter === cat
                ? "bg-obsidian text-stark-white border-obsidian"
                : "text-obsidian border-transparent hover:bg-surface-dim"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
