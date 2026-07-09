import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import logo from "../assets/logo/only-logo-sap-kotak.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Cek status isAktif di Firestore sebelum redirect
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists() && userDoc.data().isAktif === false) {
        // Paksa logout langsung agar sesi tidak tersimpan
        await signOut(auth);
        setError("nonaktif");
        setLoading(false);
        return;
      }

      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Email atau password yang Anda masukkan salah.");
          break;
        case "auth/invalid-email":
          setError("Format alamat email tidak sesuai.");
          break;
        case "auth/too-many-requests":
          setError("Terlalu banyak percobaan masuk. Coba lagi nanti.");
          break;
        default:
          setError("Gagal masuk. Silakan periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex font-sans">
      
      {/* 1. SISI KIRI: PANEL GRAFIS BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-[#59011a] via-[#740223] to-[#8a042b] p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/[0.03] blur-2xl" />
        <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-[#c5a85c]/10 blur-3xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white p-2.5 rounded-2xl shadow-lg">
            <img src={logo} alt="Logo SAP" className="h-24 w-auto object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest text-[#c5a85c] uppercase">Sinergi Andalan Prima</h3>
            <p className="text-[10px] text-white/50 tracking-wider">Mitra Andal Untuk Operasional Bisnis Anda</p>
          </div>
        </div>
        <div className="my-auto max-w-md space-y-4 relative z-10">
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Sistem Kehadiran & Absensi Karyawan
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Catat kehadiran Anda secara real-time dengan cepat, aman, dan akurat menggunakan perangkat mobile.
          </p>
          <div className="w-20 h-1 bg-[#c5a85c] rounded-full" />
        </div>
        <p className="text-xs text-white/40 relative z-10">
          © 2026 PT Sinergi Andalan Prima. All Rights Reserved.
        </p>
      </div>

      {/* 2. SISI KANAN: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 md:p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#740223]/5 blur-[100px] pointer-events-none lg:hidden" />

        {/* Logo mobile */}
        <div className="lg:hidden text-center mb-6 animate-fadeIn mt-4">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-[0_12px_40px_rgba(116,2,35,0.05)] border border-[#740223]/5 mb-3">
            <img src={logo} alt="Logo PT SAP" className="h-12 w-auto object-contain mx-auto" />
          </div>
          <h2 className="text-[10px] font-bold tracking-[0.25em] text-[#740223] uppercase">
            Portal Absensi Karyawan
          </h2>
        </div>

        {/* Card Form */}
        <div className="w-full max-w-md mx-auto my-auto bg-white lg:bg-transparent rounded-[32px] lg:rounded-none shadow-[0_20px_50px_rgba(116,2,35,0.03)] lg:shadow-none p-8 lg:p-0 border border-stone-100 lg:border-none">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang</h1>
            <p className="text-xs text-slate-500 mt-1">Silakan login untuk mencatat kehadiran Anda hari ini.</p>
          </div>

          {/* ── Error: akun nonaktif ─────────────────────── */}
          {error === "nonaktif" ? (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Akun Anda Dinonaktifkan</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Akun Anda tidak dapat digunakan saat ini. Silakan hubungi HRD atau Admin untuk informasi lebih lanjut.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/6282132800336"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-1 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Hubungi HRD via WhatsApp
              </a>
            </div>
          ) : error ? (
            <div className="mb-5 bg-red-50/80 border border-red-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#740223] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-4 focus:ring-[#740223]/5 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Sandi Akun
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#740223] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-11 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#740223] hover:bg-[#5b011b] active:scale-[0.98] disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold transition shadow-[0_10px_25px_rgba(116,2,35,0.12)] flex items-center justify-center gap-2 text-xs mt-2 cursor-pointer"
            >
              {loading ? <span>Memverifikasi...</span> : <><span>Masuk Sekarang</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">ATAU</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">Belum terdaftar sebagai karyawan?</p>
            <Link to="/register" className="inline-block mt-1 text-[#740223] font-bold hover:text-[#5b011b] text-xs hover:underline">
              Buat Akun Baru
            </Link>
          </div>
        </div>

        {/* Bantuan HRD */}
        <div className="text-center mt-6">
          <a
            href="https://wa.me/6282132800336"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-[10px] font-bold text-slate-600 hover:text-[#740223] hover:border-[#740223]/25 shadow-sm transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#c5a85c]" />
            <span>Butuh bantuan login? Hubungi HRD</span>
          </a>
        </div>

        <footer className="w-full text-center text-[10px] text-slate-400 font-medium mt-6 lg:hidden">
          © 2026 PT Sinergi Andalan Prima.
        </footer>
      </div>
    </div>
  );
}