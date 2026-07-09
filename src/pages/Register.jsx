import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  IdCard, 
  Phone, 
  Briefcase, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  UserPlus,
  HelpCircle
} from "lucide-react";
import logo from "../assets/logo/only-logo-sap-kotak.png";

export default function Register() {
  const [formData, setFormData] = useState({
    namaLengkap: "",
    nik: "",
    noHandphone: "",
    jabatan: "karyawan",
    email: "",
    password: "",
    konfirmasiPassword: "",
    isAktif: true,
    role: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.konfirmasiPassword) {
      return setError("Sandi baru dan konfirmasi sandi tidak cocok.");
    }
    if (formData.password.length < 6) {
      return setError("Sandi minimal terdiri dari 6 karakter.");
    }
    if (!formData.namaLengkap.trim() || !formData.nik.trim()) {
      return setError("Nama Lengkap dan NIK wajib diisi.");
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        namaLengkap: formData.namaLengkap.trim(),
        nik: formData.nik.trim(),
        noHandphone: formData.noHandphone.trim(),
        jabatan: formData.jabatan,
        email: formData.email.trim(),
        uid: user.uid,
        createdAt: new Date().toISOString(),
        isAktif: true,
        role: "user",
      });

      navigate("/");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Alamat email ini sudah terdaftar di sistem.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format alamat email tidak sesuai.");
      } else if (err.code === "auth/weak-password") {
        setError("Sandi terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setError("Gagal mendaftar. Pastikan jaringan internet Anda stabil.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex font-sans">
      
      {/* 1. SISI KIRI: PANEL GRAFIS BRANDING (Hanya Muncul di Desktop/Tablet >= lg) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-[#59011a] via-[#740223] to-[#8a042b] p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/[0.03] blur-2xl" />
        <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-[#c5a85c]/10 blur-3xl" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white p-2.5 rounded-2xl shadow-lg">
            <img src={logo} alt="Logo SAP" className="h-24 w-auto object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest text-[#c5a85c] uppercase">Sinergi Andalan Prima</h3>
            <p className="text-[10px] text-white/50 tracking-wider">Mitra Andal Untuk Operasional Bisnis Anda</p>
          </div>
        </div>

        {/* Mid Branding Statement */}
        <div className="my-auto max-w-md space-y-4 relative z-10">
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Gabung Bersama Sinergi Andalan Prima
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Daftarkan diri Anda untuk mendapatkan akses pencatatan kehadiran instan yang aman, andal, dan real-time.
          </p>
          <div className="w-20 h-1 bg-[#c5a85c] rounded-full" />
        </div>

        {/* Footer Brand */}
        <p className="text-xs text-white/40 relative z-10">
          © 2026 PT Sinergi Andalan Prima. All Rights Reserved.
        </p>
      </div>

      {/* 2. SISI KANAN: FORM REGISTRASI (Sangat Responsif di Handphone) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 md:p-12 lg:p-16 relative overflow-hidden">
        
        {/* Ambient Glow di Mobile */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#740223]/5 blur-[100px] pointer-events-none lg:hidden" />

        {/* Logo hanya muncul di mobile (< lg) */}
        <div className="lg:hidden text-center mb-6 animate-fadeIn mt-4">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-[0_12px_40px_rgba(116,2,35,0.05)] border border-[#740223]/5 mb-3">
            <img src={logo} alt="Logo PT SAP" className="h-12 w-auto object-contain mx-auto" />
          </div>
          <h2 className="text-[10px] font-bold tracking-[0.25em] text-[#740223] uppercase">
            Registrasi Anggota Baru
          </h2>
        </div>

        {/* Card Input Form */}
        <div className="w-full max-w-md mx-auto my-auto bg-white lg:bg-transparent rounded-[32px] lg:rounded-none shadow-[0_20px_50px_rgba(116,2,35,0.03)] lg:shadow-none p-7 md:p-8 lg:p-0 border border-stone-100 lg:border-none">
          
          <div className="mb-5 flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#740223]" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Buat Akun
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Lengkapi data untuk mendaftarkan akun absensi Anda.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-red-50/80 border border-red-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Input Nama */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="namaLengkap"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#740223]"
                />
              </div>
            </div>

            {/* Grid NIK & No HP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  NIK <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="nik"
                    required
                    placeholder="Nomor Induk Kependudukan"
                    value={formData.nik}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  No. Handphone
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    name="noHandphone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.noHandphone}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dropdown Jabatan */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Jabatan / Hak Akses <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-10 py-3 text-xs text-slate-900 appearance-none cursor-pointer focus:bg-white"
                >
                  <option value="karyawan">Karyawan Outsourcing</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="nama@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Input Password & Konfirmasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Min. 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-11 py-3 text-xs text-slate-900 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Ulangi Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="konfirmasiPassword"
                    required
                    placeholder="Sandi di atas"
                    value={formData.konfirmasiPassword}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-11 py-3 text-xs text-slate-900 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#740223] hover:bg-[#5b011b] active:scale-[0.98] disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold transition shadow-[0_10px_25px_rgba(116,2,35,0.12)] flex items-center justify-center gap-2 text-xs mt-4 cursor-pointer"
            >
              {loading ? (
                <span>Mendaftarkan...</span>
              ) : (
                <>
                  <span>Daftar Akun Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">SUDAH TERDAFTAR?</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-block text-[#740223] font-bold hover:text-[#5b011b] text-xs hover:underline"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>

        {/* WhatsApp HRD */}
        <div className="mt-5 text-center">
          <a
            href="https://wa.me/6282132800336"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-[10px] font-bold text-slate-600 hover:text-[#740223] hover:border-[#740223]/25 shadow-sm transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#c5a85c]" />
            <span>Butuh bantuan pendaftaran? Hubungi HRD</span>
          </a>
        </div>

        <footer className="w-full text-center text-[10px] text-slate-400 font-medium mt-6 lg:hidden">
          © 2026 PT Sinergi Andalan Prima.
        </footer>

      </div>
    </div>
  );
}