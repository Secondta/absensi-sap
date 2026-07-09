// HomeTab.jsx - Dashboard Karyawan (UI selaras dengan Admin)
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, XCircle,
  Eye, X, MapPin, LogIn, LogOut, Loader2
} from "lucide-react";

// ── Shared token helpers (sama persis dengan Admin HomeTab) ──────
const Label = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

export default function HomeTab({ time }) {
  const { userProfile } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({ hadir: 0, belumPulang: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  const formatTime = (date) =>
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const formatTanggal = (str) => {
    if (!str) return "-";
    const [y, m, d] = str.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    if (!userProfile?.uid) return;
    setLoading(true);
    const q = query(collection(db, "attendance"), where("uid", "==", userProfile.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      let hadir = 0, belumPulang = 0;
      snap.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() };
        data.push(item);
        if (item.absenMasuk && item.absenPulang) hadir++;
        else if (item.absenMasuk && !item.absenPulang) belumPulang++;
      });
      data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setAttendanceHistory(data);
      setStats({ hadir, belumPulang, total: data.length });
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [userProfile]);

  const handleOpenModal = (row) => {
    setSelectedRow(row);
    setLoadingModal(true);
    setModalData(null);
    setTimeout(() => { setModalData(row); setLoadingModal(false); }, 300);
  };

  const handleCloseModal = () => { setSelectedRow(null); setModalData(null); setLoadingModal(false); };

  const StatusBadge = ({ masuk, pulang }) => {
    if (masuk && pulang)
      return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">✓ Lengkap</span>;
    if (masuk)
      return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">↑ Masuk</span>;
    return <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">— Kosong</span>;
  };

  return (
    <div className="space-y-5">
      {/* Card Waktu - Sama dengan Admin HomeTab */}
      <Card className="p-5 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#740223]/10 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[#740223]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hari Ini</p>
              <p className="text-sm font-bold text-slate-700">
                {formatDate(time)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-[#c5a85c]" />
            <span className="text-xs font-bold text-slate-700">{formatTime(time)} WIB</span>
          </div>
        </div>
      </Card>

      {/* Statistik Grid - Sama dengan Admin HomeTab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 hover:border-emerald-200/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lengkap</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-emerald-600">{stats.hadir}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Absen Lengkap</p>
          </div>
        </Card>

        <Card className="p-5 hover:border-amber-200/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Belum Pulang</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-amber-600">{stats.belumPulang}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Belum Absen Pulang</p>
          </div>
        </Card>

        <Card className="p-5 hover:border-slate-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Riwayat Absensi</p>
          </div>
        </Card>
      </div>

      {/* Riwayat Absensi - Style sama dengan list karyawan di Admin */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Riwayat Absensi</h3>
          <span className="bg-[#740223]/5 text-[#740223] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Total: {stats.total}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#740223]" />
            <p className="text-xs font-semibold text-slate-400">Memuat Data...</p>
          </div>
        ) : attendanceHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Belum ada riwayat absensi.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {attendanceHistory.map((row) => (
              <div key={row.id} className="p-4 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">{formatTanggal(row.tanggal)}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      {row.absenMasuk && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <LogIn className="w-3 h-3 text-emerald-500" />
                          {row.absenMasuk.waktu}
                        </span>
                      )}
                      {row.absenPulang && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <LogOut className="w-3 h-3 text-amber-500" />
                          {row.absenPulang.waktu}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge masuk={!!row.absenMasuk} pulang={!!row.absenPulang} />
                  <button
                    onClick={() => handleOpenModal(row)}
                    className="text-[10px] bg-slate-100 hover:bg-[#740223]/5 text-slate-600 hover:text-[#740223] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL DETAIL - Sama dengan modal Admin (KaryawanTab style) */}
      {selectedRow && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-100 animate-fadeIn duration-150">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c5a85c]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Detail Absensi {formatTanggal(selectedRow.tanggal)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCloseModal} 
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 text-[#740223] animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Memuat data...</p>
                </div>
              ) : modalData ? (
                <>
                  {/* Absen Masuk */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Absen Masuk</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {modalData.absenMasuk ? (
                        <>
                          <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img 
                              src={modalData.absenMasuk.fotoUrl} 
                              alt="Foto Masuk" 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                              onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<p class="text-xs text-slate-400 text-center py-8">Foto tidak tersedia</p>'; }} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                              <Label>Waktu</Label>
                              <p className="text-xs font-bold text-slate-800 font-mono">{modalData.absenMasuk.waktu}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                              <Label>Akurasi GPS</Label>
                              <p className="text-xs font-bold text-slate-800">{modalData.absenMasuk.akurasiGpsMeter != null ? `±${modalData.absenMasuk.akurasiGpsMeter}m` : "—"}</p>
                            </div>
                          </div>
                          {modalData.absenMasuk.koordinat && modalData.absenMasuk.koordinat.lat && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${modalData.absenMasuk.koordinat.lat},${modalData.absenMasuk.koordinat.lng}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#740223] bg-[#740223]/5 py-2.5 rounded-xl hover:bg-[#740223]/10 transition"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Lihat Lokasi Maps
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">Belum melakukan absen masuk</p>
                      )}
                    </div>
                  </div>

                  {/* Absen Pulang */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Absen Pulang</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {modalData.absenPulang ? (
                        <>
                          <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img 
                              src={modalData.absenPulang.fotoUrl} 
                              alt="Foto Pulang" 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                              onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<p class="text-xs text-slate-400 text-center py-8">Foto tidak tersedia</p>'; }} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                              <Label>Waktu</Label>
                              <p className="text-xs font-bold text-slate-800 font-mono">{modalData.absenPulang.waktu}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                              <Label>Akurasi GPS</Label>
                              <p className="text-xs font-bold text-slate-800">{modalData.absenPulang.akurasiGpsMeter != null ? `±${modalData.absenPulang.akurasiGpsMeter}m` : "—"}</p>
                            </div>
                          </div>
                          {modalData.absenPulang.koordinat && modalData.absenPulang.koordinat.lat && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${modalData.absenPulang.koordinat.lat},${modalData.absenPulang.koordinat.lng}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#740223] bg-[#740223]/5 py-2.5 rounded-xl hover:bg-[#740223]/10 transition"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Lihat Lokasi Maps
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-amber-700 font-medium italic text-center py-4 bg-amber-50/50 rounded-xl">Belum melakukan absen pulang</p>
                      )}
                    </div>
                  </div>

                  {modalData.dikirimPada && (
                    <p className="text-center text-[10px] text-slate-300 font-medium pt-2">
                      Dikirim: {new Date(modalData.dikirimPada).toLocaleString("id-ID")}
                    </p>
                  )}
                </>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end shrink-0 bg-white">
              <button 
                onClick={handleCloseModal}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}