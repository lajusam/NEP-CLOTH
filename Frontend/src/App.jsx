import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import CursorFollower from "./components/CursorFollower";
import CartDrawer from "./components/CartDrawer";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const HomePage = lazy(() => import("./pages/HomePage"));
const WomenPage = lazy(() => import("./pages/WomenPage"));
const MenPage = lazy(() => import("./pages/MenPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const MyReviewsPage = lazy(() => import("./pages/MyReviewsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CustomerOrdersPage = lazy(() => import("./pages/OrdersPage"));
const CustomerOrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const AddEditProductPage = lazy(() => import("./pages/admin/AddEditProductPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/OrderDetailPage"));
const InventoryPage = lazy(() => import("./pages/admin/InventoryPage"));
const CustomersPage = lazy(() => import("./pages/admin/CustomersPage"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage"));

function StorefrontLayout() {
  return <><CursorFollower /><Navbar /><Suspense fallback={<div className="route-loading" aria-hidden="true" />}><main id="main-content"><Outlet /></main></Suspense></>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple 404 page for unknown /admin/* routes — shown inside admin layout
function AdminNotFound() {
  return (
    <div className="px-8 py-16 text-center">
      <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-altitude-orange block mb-3">404</span>
      <h1 className="font-display text-[clamp(48px,6vw,80px)] leading-none tracking-tight text-obsidian uppercase mb-4">
        Page Not Found
      </h1>
      <p className="font-sans text-[13px] text-secondary">
        This admin page does not exist. Use the sidebar to navigate.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <CartDrawer />
          <Routes>
            {/* Storefront routes */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/women" element={<WomenPage />} />
              <Route path="/men" element={<MenPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/reviews"
              element={
                <ProtectedRoute>
                  <MyReviewsPage />
                </ProtectedRoute>
              }
            />

            {/* Customer Checkout & Orders (Protected) */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CustomerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <CustomerOrderDetailPage />
                </ProtectedRoute>
              }
            />
            </Route>

            {/* Admin routes — guarded by AdminRoute (server enforces requireAdmin on all /admin API calls) */}
              <Route
              path="/admin"
              element={
                <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
                  <AdminRoute><AdminLayout /></AdminRoute>
                </Suspense>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<AddEditProductPage />} />
              <Route path="products/:id/edit" element={<AddEditProductPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              {/* Catch-all: unknown /admin/* paths show a simple not-found within the admin layout */}
              <Route path="*" element={<AdminNotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
