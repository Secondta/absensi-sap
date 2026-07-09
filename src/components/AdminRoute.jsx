// src/components/AdminRoute.jsx
//
// Penjaga pintu untuk halaman ADMIN.
// Aturan:
// - Belum login              → redirect ke /login
// - Login sebagai karyawan   → redirect ke / (salah halaman)
// - Login sebagai admin      → tampilkan halaman

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, userProfile } = useAuth();

  // Belum login sama sekali
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Sudah login tapi bukan admin → arahkan ke dashboard karyawan
  if (userProfile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}