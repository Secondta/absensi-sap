import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function PublicRoute({ children }) {
  const { userProfile, loading } = useAuth();

  // Jika Auth masih loading membaca session firebase, tampilkan splash/loader dulu
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#740223]" />
        <p className="text-xs text-slate-400 font-bold tracking-wider mt-3 uppercase">
          Memvalidasi Sesi...
        </p>
      </div>
    );
  }

  // 🚪 JIKA SUDAH LOGIN: Blokir akses ke login/register, arahkan sesuai role-nya
  if (userProfile) {
    if (userProfile.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // 🔓 JIKA BELUM LOGIN: Izinkan masuk ke halaman login/register
  return children;
}