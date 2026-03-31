import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Collection from "./pages/Collection.jsx";
import About from "./pages/About.jsx";

import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import NotFound from "./pages/NotFound.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Account from "./pages/Account.jsx";
import Referral from "./pages/Referral.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Admin Imports
import { AdminProvider } from "./context/AdminContext";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminProductSets from "./pages/admin/ProductSets";
import AdminCollections from "./pages/admin/Collections";
import AdminOrders from "./pages/admin/Orders";

export default function App() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-in-out", once: true });
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <Routes>
            {/* Auth Routes (no Layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Main Storefront Routes */}
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/collections/:slug" element={<Collection />} />
              <Route path="/about" element={<About />} />
              <Route path="/referral" element={<Referral />} />

              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="/order/success/:orderId" element={<OrderSuccess />} />
              <Route path="/product/:id" element={<ProductDetails />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="product-sets" element={<AdminProductSets />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}