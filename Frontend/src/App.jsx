import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import CursorFollower from "./components/CursorFollower";
import CartDrawer from "./components/CartDrawer";
import HomePage from "./pages/HomePage";
import WomenPage from "./pages/WomenPage";
import MenPage from "./pages/MenPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AccountPage from "./pages/AccountPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CustomerOrdersPage from "./pages/OrdersPage";
import CustomerOrderDetailPage from "./pages/OrderDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Admin imports
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import AddEditProductPage from "./pages/admin/AddEditProductPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import AdminOrderDetailPage from "./pages/admin/OrderDetailPage";
import InventoryPage from "./pages/admin/InventoryPage";
import CustomersPage from "./pages/admin/CustomersPage";
import ReviewsPage from "./pages/admin/ReviewsPage";

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
      <AuthProvider>
        <CartProvider>
          <CartDrawer />
          <Routes>
            {/* Storefront routes */}
            <Route path="/" element={<><CursorFollower /><Navbar /><HomePage /></>} />
            <Route path="/women" element={<><CursorFollower /><Navbar /><WomenPage /></>} />
            <Route path="/men" element={<><CursorFollower /><Navbar /><MenPage /></>} />
            <Route path="/product/:slug" element={<><CursorFollower /><Navbar /><ProductPage /></>} />
            <Route path="/cart" element={<><CursorFollower /><Navbar /><CartPage /></>} />

            {/* Auth routes */}
            <Route path="/login" element={<><CursorFollower /><Navbar /><LoginPage /></>} />
            <Route path="/signup" element={<><CursorFollower /><Navbar /><SignUpPage /></>} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <CursorFollower />
                  <Navbar />
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/reviews"
              element={
                <ProtectedRoute>
                  <CursorFollower />
                  <Navbar />
                  <MyReviewsPage />
                </ProtectedRoute>
              }
            />

            {/* Customer Checkout & Orders (Protected) */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CursorFollower />
                  <Navbar />
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CursorFollower />
                  <Navbar />
                  <CustomerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <CursorFollower />
                  <Navbar />
                  <CustomerOrderDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes — guarded by AdminRoute (server enforces requireAdmin on all /admin API calls) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
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
    </BrowserRouter>
  );
}
