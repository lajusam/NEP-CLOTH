import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FlowingMenu.css";

export default function FlowingMenu({
  items = [],
  speed = 15,
  textColor = "#ffffff",
  bgColor = "#000000",
  marqueeBgColor = "#ffffff",
  marqueeTextColor = "#000000",
  borderColor = "#ffffff",
  onItemHover,
  onNavigate,
}) {
  return (
    <div className="flowing-menu-wrap" style={{ backgroundColor: bgColor }}>
      <ul className="flowing-menu">
        {items.map((item, i) => (
          <FlowingMenuItem
            key={i}
            item={item}
            speed={speed}
            textColor={textColor}
            bgColor={bgColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            onItemHover={onItemHover}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

function FlowingMenuItem({
  item,
  speed,
  textColor,
  bgColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  onItemHover,
  onNavigate,
}) {
  const itemRef = useRef(null);
  const navigate = useNavigate();

  const repeats = 12;
  const textContent = Array.from({ length: repeats }, (_, i) => (
    <span key={i} className="flowing-menu-item-marquee-text" style={{ color: textColor }}>
      {item.text}
    </span>
  ));

  const handleMouseEnter = () => {
    if (onItemHover) onItemHover(item.image);
  };

  const handleMouseLeave = () => {
    if (onItemHover) onItemHover(null);
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(item.link);
    } else {
      navigate(item.link);
    }
  };

  return (
    <li
      ref={itemRef}
      className="flowing-menu-item"
      style={{ borderColor: borderColor, backgroundColor: bgColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flowing-menu-item-bg">
        <img src={item.image} alt={item.text} />
      </div>

      <a
        href={item.link}
        onClick={handleClick}
        className="flowing-menu-item-marquee"
        style={{ textDecoration: "none" }}
      >
        <div
          className="flowing-menu-item-marquee-inner"
          style={{ "--flow-speed": `${speed}s` }}
        >
          {textContent}
          {textContent}
        </div>
      </a>
    </li>
  );
}
