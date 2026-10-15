import { useState } from 'react';

export default function SegmentedControl({ options = [], value: controlledValue, onChange }) {
  const [internalValue, setInternalValue] = useState(options[0] || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleSelect = (opt) => {
    if (controlledValue === undefined) setInternalValue(opt);
    onChange?.(opt);
  };

  return (
    <div className="border border-obsidian/20 inline-flex">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleSelect(opt)}
          className={`font-sans text-[12px] uppercase tracking-[0.2em] px-4 py-2 transition-colors duration-150 ${
            i < options.length - 1 ? 'border-r border-obsidian/15' : ''
          } ${
            value === opt
              ? 'bg-obsidian text-stark-white'
              : 'text-secondary hover:text-obsidian'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
