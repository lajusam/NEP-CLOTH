import { useRef } from "react";

export default function CategoryTabs({ tabs, value, onChange, label = "Product categories", panelId }) {
  const refs = useRef([]);
  const onKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return <div className="storefront-tabs" role="tablist" aria-label={label}>
    {tabs.map((tab, index) => <button key={tab.id} ref={(element) => { refs.current[index] = element; }} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={value === tab.id} aria-controls={panelId || `panel-${tab.id}`} tabIndex={value === tab.id ? 0 : -1} className={`storefront-tab${value === tab.id ? " active" : ""}`} onClick={() => onChange(tab.id)} onKeyDown={(event) => onKeyDown(event, index)}>{tab.label}</button>)}
  </div>;
}
