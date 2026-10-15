import { fetchProducts, formatPrice } from "./api";

const cache = new Map();

export function fetchStorefrontProducts(filters = {}) {
  const normalized = {
    section: filters.section || "",
    category: filters.category || "",
    page: filters.page || 1,
    limit: filters.limit || 8,
  };
  const key = JSON.stringify(normalized);
  if (!cache.has(key)) {
    const request = fetchProducts(normalized).catch((error) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, request);
  }
  return cache.get(key);
}

export const formatNPR = formatPrice;
