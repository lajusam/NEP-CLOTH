import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { fetchProductBySlug, formatPrice } from "../lib/api";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "nep_cloth_cart_v1";

export function CartProvider({ children }) {
  // 1. Initial cart items loaded from localStorage
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Could not save cart to localStorage:", err);
    }
  }, [items]);

  /**
   * Re-fetches current live prices and stock levels from the API.
   * Warns clearly if prices changed or items went out of stock.
   */
  const syncCartWithApi = useCallback(async () => {
    if (items.length === 0) return;

    setIsSyncing(true);
    const newWarnings = [];

    try {
      // Find all distinct product slugs in cart
      const uniqueSlugs = Array.from(new Set(items.map((i) => i.slug).filter(Boolean)));
      const productMap = new Map();

      await Promise.all(
        uniqueSlugs.map(async (slug) => {
          try {
            const prod = await fetchProductBySlug(slug);
            productMap.set(slug, prod);
          } catch {
            // Product might have been removed
          }
        })
      );

      setItems((prevItems) => {
        let changed = false;
        const updated = prevItems.map((item) => {
          const product = productMap.get(item.slug);
          if (!product) {
            newWarnings.push(`"${item.name}" is currently unavailable.`);
            changed = true;
            return { ...item, stock: 0, isUnavailable: true };
          }

          const liveVariant = product.variants?.find((v) => v.id === item.variantId);
          if (!liveVariant) {
            newWarnings.push(`"${item.name}" (${item.size}/${item.color}) is no longer available.`);
            changed = true;
            return { ...item, stock: 0, isUnavailable: true };
          }

          let updatedQty = item.quantity;
          const liveStock = liveVariant.stock;

          // Check out-of-stock
          if (liveStock <= 0) {
            newWarnings.push(`"${item.name}" (${item.size}/${item.color}) is now out of stock.`);
            changed = true;
          } else if (liveStock < item.quantity) {
            newWarnings.push(
              `"${item.name}" (${item.size}/${item.color}) stock dropped to ${liveStock}. Quantity adjusted.`
            );
            updatedQty = liveStock;
            changed = true;
          }

          // Check live price change
          const livePrice = product.price;
          if (item.price !== livePrice) {
            newWarnings.push(
              `"${item.name}" price updated from ${formatPrice(item.price)} to ${formatPrice(livePrice)}.`
            );
            changed = true;
          }

          return {
            ...item,
            price: livePrice,
            stock: liveStock,
            quantity: updatedQty,
            isUnavailable: liveStock <= 0,
          };
        });

        return changed ? updated : prevItems;
      });

      if (newWarnings.length > 0) {
        setWarnings((prev) => Array.from(new Set([...prev, ...newWarnings])));
      }
    } catch (err) {
      console.warn("Cart synchronization error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [items]);

  // Open cart drawer and sync prices/stock
  const openCart = useCallback(() => {
    setIsCartOpen(true);
    syncCartWithApi();
  }, [syncCartWithApi]);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => {
      const next = !prev;
      if (next) syncCartWithApi();
      return next;
    });
  }, [syncCartWithApi]);

  /**
   * Add variant to cart with selected size, color, and quantity.
   */
  const addToCart = useCallback(
    ({ variantId, quantity = 1, slug, name, size, color, image, price, maxStock = 10 }) => {
      if (!variantId) throw new Error("Variant ID is required to add to cart");
      if (maxStock <= 0) throw new Error("Item is out of stock");

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.variantId === variantId);

        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          const newQty = Math.min(existing.quantity + quantity, maxStock, 10);
          const next = [...prev];
          next[existingIndex] = {
            ...existing,
            quantity: newQty,
            stock: maxStock,
          };
          return next;
        }

        return [
          ...prev,
          {
            variantId,
            quantity: Math.min(quantity, maxStock, 10),
            slug,
            name,
            size,
            color,
            image,
            price: Number(price) || 0,
            stock: maxStock,
            isUnavailable: false,
          },
        ];
      });

      // Auto open cart drawer to confirm addition
      openCart();
    },
    [openCart]
  );

  /**
   * Update item quantity (1 to available stock, max 10).
   */
  const updateQuantity = useCallback((variantId, newQuantity) => {
    setItems((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((i) => i.variantId !== variantId);
      }
      return prev.map((item) => {
        if (item.variantId === variantId) {
          const max = item.stock != null ? Math.min(item.stock, 10) : 10;
          return {
            ...item,
            quantity: Math.max(1, Math.min(newQuantity, max)),
          };
        }
        return item;
      });
    });
  }, []);

  /**
   * Remove single item from cart.
   */
  const removeItem = useCallback((variantId) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  /**
   * Clear all items from cart.
   */
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  // Derived totals
  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  const previewSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  }, [items]);

  const shippingFee = 0; // free standard delivery
  const previewTotal = previewSubtotal + shippingFee;

  const value = {
    items,
    totalCount,
    previewSubtotal,
    shippingFee,
    previewTotal,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    syncCartWithApi,
    warnings,
    clearWarnings,
    isSyncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
