// src/components/ProtectedRoute.jsx
//
// Penjaga pintu untuk halaman KARYAWAN.
// Aturan:
// - Belum login              → redirect ke /login
// - Login sebagai admin      → redirect ke /admin (salah halaman)
// - Login sebagai karyawan   → tampilkan halaman

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, userProfile } = useAuth();

  // Belum login sama sekali
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Sudah login tapi ternyata admin → arahkan ke panel admin
  if (userProfile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}