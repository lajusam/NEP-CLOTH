// API client helper for NEP-CLOTH
import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/**
 * Returns Authorization header with Supabase session Bearer token if logged in.
 */
async function getAuthHeaders() {
  const headers = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Graceful fallback if session retrieval fails
  }
  return headers;
}

/**
 * Format paisa integer (or existing string) into standard "NPR 8,500" display.
 * 850000 paisa -> "NPR 8,500"
 */
export function formatPrice(price) {
  if (typeof price === "number") {
    const rupees = Math.round(price / 100);
    return `NPR ${rupees.toLocaleString("en-US")}`;
  }
  if (typeof price === "string") {
    if (price.startsWith("NPR")) return price;
    const num = Number(price);
    if (!isNaN(num)) {
      return `NPR ${Math.round(num / 100).toLocaleString("en-US")}`;
    }
    return price;
  }
  return "NPR 0";
}

/**
 * Get main image from product.
 * images[0] is the primary product image.
 */
export function getMainImage(product) {
  if (!product) return "";
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return product.image || "";
}

/**
 * Get model image from product.
 * images[1] is the paired model image.
 */
export function getModelImage(product) {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 1) {
    return product.images[1];
  }
  return product.modelImage || null;
}

/**
 * Fetch products list with optional filters and pagination.
 */
export async function fetchProducts({ section, category, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (section) params.set("section", section);
  if (category) params.set("category", category);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const url = `${API_BASE}/products${query ? `?${query}` : ""}`;

  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch products (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Fetch single product by slug (with variants).
 */
export async function fetchProductBySlug(slug) {
  if (!slug) throw new Error("Product slug is required");

  const url = `${API_BASE}/products/${encodeURIComponent(slug)}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch product "${slug}" (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Fetch current user's profile from backend (GET /auth/me).
 * Returns { id, email, name, role }.
 */
export async function fetchMe() {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch user profile (${res.status})`);
  }

  return res.json();
}

/**
 * Place a new Cash on Delivery order.
 * Accepts items: [{ variantId, quantity }] and shipping details.
 */
export async function createOrder({ items, shipping }) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ items, shipping }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(json.error || json.message || `Order placement failed (${res.status})`);
    (error).status = res.status;
    (error).details = json.details;
    (error).outOfStockItem = json.outOfStockItem;
    throw error;
  }

  return json.data;
}

/**
 * Fetch orders placed by the authenticated user (GET /orders/me).
 */
export async function fetchMyOrders() {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/orders/me`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch orders (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Fetch single order by id or orderNumber (GET /orders/:id).
 */
export async function fetchOrderById(id) {
  if (!id) throw new Error("Order ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Order not found (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

// ==========================================
// ADMIN API HELPERS (requireAuth + requireAdmin)
// ==========================================

/**
 * Fetch all products for admin catalog (including inactive), with filters, search, pagination.
 */
export async function fetchAdminProducts({ section, category, active, search, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (section && section !== "ALL") params.set("section", section);
  if (category && category !== "ALL") params.set("category", category);
  if (active && active !== "ALL") params.set("active", active);
  if (search && search.trim()) params.set("search", search.trim());
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const url = `${API_BASE}/admin/products${query ? `?${query}` : ""}`;

  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch admin products (${res.status})`);
  }

  const json = await res.json();
  return json;
}

/**
 * Fetch single product with all variants by ID (admin view).
 */
export async function fetchAdminProductById(id) {
  if (!id) throw new Error("Product ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Product not found (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Create a new product with variants (POST /admin/products).
 */
export async function createAdminProduct(productData) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(productData),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error || (json.details ? json.details.map((d) => d.message).join(", ") : "Failed to create product");
    throw new Error(msg);
  }

  return json.data;
}

/**
 * Update existing product (PATCH /admin/products/:id).
 */
export async function updateAdminProduct(id, productData) {
  if (!id) throw new Error("Product ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(productData),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error || (json.details ? json.details.map((d) => d.message).join(", ") : "Failed to update product");
    throw new Error(msg);
  }

  return json.data;
}

/**
 * Archive a product (sets active: false).
 */
export async function archiveAdminProduct(id) {
  if (!id) throw new Error("Product ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: { ...authHeaders },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to archive product (${res.status})`);
  }

  return json.data;
}

/**
 * Restore an archived product (sets active: true).
 */
export async function restoreAdminProduct(id) {
  if (!id) throw new Error("Product ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}/restore`, {
    method: "POST",
    headers: { ...authHeaders },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to restore product (${res.status})`);
  }

  return json.data;
}

/** Delete a catalog listing using the existing admin DELETE route. The API preserves order history and archives the listing. */
export async function deleteAdminProduct(id) {
  if (!id) throw new Error('Product ID is required');
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...authHeaders },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Failed to delete product (${res.status})`);
  return json.data;
}

/**
 * Add a new variant to an existing product (POST /admin/products/:id/variants).
 */
export async function addAdminVariant(productId, variantData) {
  if (!productId) throw new Error("Product ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(productId)}/variants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(variantData),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to add variant (${res.status})`);
  }

  return json.data;
}

/**
 * Update stock, size, or color of a variant (PATCH /admin/variants/:id).
 */
export async function updateAdminVariant(variantId, variantData) {
  if (!variantId) throw new Error("Variant ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/variants/${encodeURIComponent(variantId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(variantData),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to update variant (${res.status})`);
  }

  return json.data;
}

/**
 * Delete a variant if not in OrderItem history (DELETE /admin/variants/:id).
 */
export async function deleteAdminVariant(variantId) {
  if (!variantId) throw new Error("Variant ID is required");

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/variants/${encodeURIComponent(variantId)}`, {
    method: "DELETE",
    headers: { ...authHeaders },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Failed to delete variant (${res.status})`);
  }

  return json;
}

/**
 * Upload image to Supabase Storage via backend (POST /admin/uploads/image).
 * Accepts File or Blob.
 */
export async function uploadAdminImage(file) {
  if (!file) throw new Error("No file provided for upload");

  const formData = new FormData();
  formData.append("image", file);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/uploads/image`, {
    method: "POST",
    headers: { ...authHeaders },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Image upload failed (${res.status})`);
  }

  return json;
}

// ==========================================
// Admin Orders, Dashboard & Customers API
// ==========================================

/**
 * Fetch orders for admin panel (GET /admin/orders).
 */
export async function fetchAdminOrders({ status, search, from, to, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search && search.trim()) params.set("search", search.trim());
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const url = `${API_BASE}/admin/orders${query ? `?${query}` : ""}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, { headers: { ...authHeaders } });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch orders (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch order by ID or orderNumber for admin panel (GET /admin/orders/:id).
 */
export async function fetchAdminOrderById(id) {
  if (!id) throw new Error("Order ID is required");
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Order not found (${res.status})`);
  }

  return await res.json();
}

/**
 * Update order status with transition rules (PATCH /admin/orders/:id/status).
 */
export async function updateAdminOrderStatus(id, status, note) {
  if (!id) throw new Error("Order ID is required");
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ status, note }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error || (json.details ? json.details.join(", ") : "Failed to update order status");
    throw new Error(msg);
  }

  return json;
}

/**
 * Fetch dashboard metrics, recent orders, and 7D/30D sales (GET /admin/dashboard).
 */
export async function fetchAdminDashboard() {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { ...authHeaders },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch dashboard metrics (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch customers list for admin panel (GET /admin/customers).
 */
export async function fetchAdminCustomers({ search, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set("search", search.trim());
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const url = `${API_BASE}/admin/customers${query ? `?${query}` : ""}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, { headers: { ...authHeaders } });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch customers (${res.status})`);
  }

  return await res.json();
}

async function requestReviewApi(path, init = {}) {
  const authHeaders = await getAuthHeaders();
  const hasBody = init.body !== undefined;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...init.headers,
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(payload.error || `Review request failed (${res.status})`);
    error.status = res.status;
    error.reason = payload.reason;
    throw error;
  }
  return payload;
}

export function fetchProductReviews(slug, { sort = "newest", page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
  return requestReviewApi(`/products/${encodeURIComponent(slug)}/reviews?${params}`);
}

export function fetchReviewEligibility(slug) {
  return requestReviewApi(`/products/${encodeURIComponent(slug)}/reviews/eligibility`);
}

export function createProductReview(slug, review) {
  return requestReviewApi(`/products/${encodeURIComponent(slug)}/reviews`, { method: "POST", body: JSON.stringify(review) });
}

export function updateReview(id, review) {
  return requestReviewApi(`/reviews/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(review) });
}

export function deleteReview(id) {
  return requestReviewApi(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function reportReview(id, report) {
  return requestReviewApi(`/reviews/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(report) });
}

export async function fetchMyReviews() {
  return (await requestReviewApi("/me/reviews")).data || [];
}

export function fetchAdminReviewSummary() {
  return requestReviewApi("/admin/reviews/summary");
}

export function fetchAdminReviews({ status = "all", rating, reported, search = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  if (rating && rating !== "all") params.set("rating", String(rating));
  if (reported !== undefined) params.set("reported", String(reported));
  if (search.trim()) params.set("search", search.trim());
  return requestReviewApi(`/admin/reviews?${params}`);
}

export async function fetchAdminReviewById(id) {
  return (await requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}`)).data;
}

export async function hideAdminReview(id, reason) {
  return requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}/hide`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function unhideAdminReview(id) {
  return requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}/unhide`, { method: "PATCH" });
}

export function replyToReview(id, reply) {
  return requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}/reply`, { method: "POST", body: JSON.stringify({ reply }) });
}

export function removeReviewReply(id) {
  return requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}/reply`, { method: "DELETE" });
}

export function deleteAdminReview(id) {
  return requestReviewApi(`/admin/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
}

