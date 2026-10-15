export default function MarqueeStrip() {
  const items = [
    "AUTUMN WINTER 2024",
    "THE NEW ALTITUDE",
    "HIMALAYAN BRUTALISM",
    "KATHMANDU HERITAGE",
    "CRAFTED FOR ALTITUDE",
  ];

  const content = items.map((item, i) => (
    <span key={i}>
      <span className="px-8">{item}</span>
      <span className="px-8">+</span>
    </span>
  ));

  return (
    <div className="w-full bg-obsidian text-stark-white py-4 overflow-hidden border-b border-white/20">
      <div className="whitespace-nowrap flex marquee-text font-sans text-[12px] tracking-[0.15em] uppercase">
        {/* Duplicate content for seamless loop */}
        {content}
        {content}
      </div>
    </div>
  );
}
