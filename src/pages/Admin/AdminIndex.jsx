import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Sliders, 
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  MapPinned,
} from "lucide-react";
import AdminHomeTab from "./HomeTab";
import KaryawanTab from "./KaryawanTab";
import RekapAbsenTab from "./RekapAbsenTab";
import AreaTab from "./AreaTab";
import logo from "../../assets/logo/only-logo-sap.png";

export default function AdminIndex() {
  const { userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hrs = time.getHours();
    if (hrs < 11) return "Selamat Pagi";
    if (hrs < 15) return "Selamat Siang";
    if (hrs < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "karyawan", label: "Kelola Karyawan", icon: Users },
    { id: "area", label: "Kelola Area", icon: MapPinned },
    { id: "rekap", label: "Rekap Absen", icon: ClipboardList },
  ];

  return (
    // PERBAIKAN 1: Mengubah min-h-screen menjadi h-screen dan mengunci overflow global pada layar laptop/desktop
    <div className="h-screen bg-[#F7F5F2] text-slate-800 flex font-sans overflow-hidden">

      {/* ── SIDEBAR DESKTOP ─────────────────────────────── */}
      {/* PERBAIKAN 2: Menghapus 'sticky top-0', menambahkan 'shrink-0', dan mengaktifkan internal overflow-y-auto jika menu navigasi penuh */}
      <aside
        className={`hidden md:flex flex-col justify-between h-screen z-30 bg-white border-r border-slate-100 transition-all duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? "md:w-60" : "md:w-[68px]"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div>
            {/* Logo / Ikon */}
            <div className={`border-b border-slate-100 flex flex-col items-center transition-all duration-300 ${sidebarOpen ? "px-6 py-7 gap-3" : "px-0 py-5 gap-0"}`}>
              <img src={logo} alt="Logo PT SAP" className="h-10 w-auto object-contain" />
              {sidebarOpen && (
                <div className="text-center">
                  <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#740223] uppercase block">
                    Panel Admin
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                    PT Sinergi Andalan Prima
                  </span>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav className={`space-y-1 mt-3 ${sidebarOpen ? "p-3" : "px-2.5 py-3"}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center transition-all duration-200 cursor-pointer rounded-2xl font-bold text-[11px] uppercase tracking-wider ${
                      sidebarOpen ? "gap-3 px-4 py-3" : "justify-center px-0 py-3"
                    } ${
                      isActive
                        ? sidebarOpen
                          ? "bg-[#740223]/5 text-[#740223] border-l-[3px] border-[#740223] pl-3.5"
                          : "bg-[#740223]/5 text-[#740223]"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`shrink-0 w-5 h-5 ${isActive ? "text-[#740223]" : "text-slate-400"}`} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Sidebar */}
          <div className={`border-t border-slate-100 space-y-3 mt-auto ${sidebarOpen ? "p-4" : "px-2.5 py-4"}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#740223] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{userProfile?.namaLengkap || "Administrator"}</p>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">HRD Admin</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-xl bg-[#740223] text-white flex items-center justify-center font-bold text-sm uppercase"
                  title="Admin">
                  A
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title={!sidebarOpen ? "Keluar Aplikasi" : undefined}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Keluar Aplikasi</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── AREA UTAMA ───────────────────────────────────── */}
      {/* PERBAIKAN 3: Mengubah min-h-screen menjadi h-full dan menambahkan overflow-y-auto di sini agar isi data admin bisa di-scroll terpisah */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">

        {/* Header */}
        <header className="bg-gradient-to-r from-[#740223] to-[#59011a] text-white pt-8 pb-14 px-6 md:px-10 rounded-b-[36px] md:rounded-none md:pb-8 shadow-[0_8px_24px_rgba(116,2,35,0.12)] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-72 h-full rounded-l-full bg-white/[0.03] blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-24 bg-[#c5a85c]/10 blur-2xl pointer-events-none" />

          <div className="flex justify-between items-center relative z-10 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-[#c5a85c] text-white flex items-center justify-center font-bold text-sm border border-white/20 shadow uppercase md:hidden shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">{getGreeting()}, Portal Admin</p>
                <h2 className="text-base md:text-lg font-extrabold tracking-tight line-clamp-1">
                  {userProfile?.namaLengkap || "HRD Administrator"}
                </h2>
              </div>
            </div>

            {/* Tombol Logout Khusus Mobile */}
            <button
              onClick={logout}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-red-300 transition border border-white/5 cursor-pointer ml-4 shrink-0"
              title="Keluar Aplikasi"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

            {/* Tombol toggle sidebar — hanya di desktop */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Konten */}
        <main className="px-5 md:px-10 -mt-8 md:-mt-4 relative z-20 flex-1 max-w-5xl w-full mx-auto pb-24 md:pb-10">
          <div className={activeTab === "dashboard" ? "" : "hidden"}><AdminHomeTab time={time} /></div>
          <div className={activeTab === "karyawan" ? "" : "hidden"}><KaryawanTab /></div>
          <div className={activeTab === "area" ? "" : "hidden"}><AreaTab /></div>
          <div className={activeTab === "rekap" ? "" : "hidden"}><RekapAbsenTab /></div>
        </main>
      </div>

      {/* ── BOTTOM NAV MOBILE ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2.5 flex justify-around items-center z-50 rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition cursor-pointer shrink-0 ${
                isActive ? "text-[#740223]" : "text-slate-400"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span className="text-[8px] font-bold uppercase tracking-wider">{item.label.split(" ")[0]}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#c5a85c]" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}