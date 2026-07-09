import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicRoute from "./components/PublicRoute"; // 👈 Impor komponen baru ini
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardIndex from "./pages/Dashboard/Index";
import AdminIndex from "./pages/Admin/AdminIndex";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ✅ Rute Karyawan — hanya bisa diakses jika login sebagai karyawan */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardIndex />
              </ProtectedRoute>
            }
          />

          {/* ✅ Rute Admin — hanya bisa diakses jika login sebagai admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminIndex />
              </AdminRoute>
            }
          />

          {/* 🔒 Rute publik terproteksi — Jika sudah login, tidak bisa masuk ke sini lagi */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Tangkap URL tidak dikenal → redirect ke home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);