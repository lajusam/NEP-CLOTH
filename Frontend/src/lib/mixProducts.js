export function interleaveByCategory(products, seed = Math.random()) {
  const groups = new Map();
  for (const product of products) {
    const category = String(product.category || "other").toLowerCase();
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(product);
  }

  const categories = [...groups.keys()];
  if (categories.length < 2) return products;

  let state = Math.max(1, Math.floor(seed * 0x100000000));
  const random = () => {
    state = (1664525 * state + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
  for (let index = categories.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [categories[index], categories[swapIndex]] = [categories[swapIndex], categories[index]];
  }

  const offsets = new Map(categories.map((category) => [category, 0]));
  const mixed = [];
  while (mixed.length < products.length) {
    for (const category of categories) {
      const offset = offsets.get(category);
      const group = groups.get(category);
      if (offset >= group.length) continue;
      mixed.push(group[offset]);
      offsets.set(category, offset + 1);
    }
  }
  return mixed;
}
