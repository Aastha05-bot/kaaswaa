import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import UnAuthorized from "./pages/UnAuthorized";
import Product from "./pages/Product";
import Categories from "./pages/Categories";
import AboutUs from "./pages/AboutUs";
import UserProfile from "./pages/UserProfile";
import Staff from "./pages/Staff";
import StaffManagement from "./pages/StaffManagement";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import OrderConfirm from "./pages/OrderConfirm";
import Payment from "./pages/Payment";
import EmailTemplate from "./pages/EmailTemplate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/unauthorized" element={<UnAuthorized />} />
        <Route path="/products" element={<Product />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<Categories />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/order-confirm" element={<OrderConfirm />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/email-template" element={<EmailTemplate />} />
        <Route path="/staff-management" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <StaffManagement />
          </ProtectedRoute>
        }/>
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/wishlist" element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Wishlist />
          </ProtectedRoute>
        }/>
        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Cart />
          </ProtectedRoute>
        }/>

        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Home />
          </ProtectedRoute>
        }/>

        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <Staff />
          </ProtectedRoute>
        }/>

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["user", "staff", "admin"]}>
            <UserProfile />
          </ProtectedRoute>
        }/>

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;