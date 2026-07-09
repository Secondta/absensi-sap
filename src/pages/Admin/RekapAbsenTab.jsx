// RekapAbsenTab.jsx - UI disesuaikan serasi dengan tab lainnya
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { Calendar, Filter, FileSpreadsheet, Loader2, Search, ArrowRight, X, Clock, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>{children}</div>
);

export default function RekapAbsenTab() {
  // State Filter & Search
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State Utama Data Firebase
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Lazy Loading Detail Modal Absen
  const [selectedAbsen, setSelectedAbsen] = useState(null);

  // Fetch Data Absensi Realtime dari Firestore
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // Ambil semua data dari collection attendance
        const usersSnapshot = await getDocs(collection(db, "attendance"));
        const allAttendance = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Cek apakah user memiliki data absensi (absenMasuk ATAU absenMusk ATAU absenPulang)
          const hasAbsenMasuk = userData.absenMasuk || userData.absenMusk;
          const hasAbsenPulang = userData.absenPulang;
          
          if (hasAbsenMasuk || hasAbsenPulang) {
            // Handle field name typo: absenMusk -> absenMasuk
            const absenMasukData = userData.absenMasuk || userData.absenMusk || null;
            
            // Ambil data absen dari user
            const record = {
              id: userDoc.id,
              userId: userDoc.id,
              namaLengkap: userData.namaLengkap || userData.nama || "—",
              jabatan: userData.jabatan || userData.posisi || "Karyawan",
              tanggal: userData.tanggal || null,
              absenMasuk: absenMasukData,
              absenPulang: hasAbsenPulang ? userData.absenPulang : null,
              // Data tambahan untuk debugging
              rawData: userData
            };
            
            // Hanya tambahkan jika memiliki minimal satu absen dan tanggal valid
            if (record.tanggal) {
              allAttendance.push(record);
            }
          }
        }
        
        console.log("Data yang ditemukan:", allAttendance); // Debugging
        
        // Sortir berdasarkan tanggal terbaru
        allAttendance.sort((a, b) => {
          if (!a.tanggal) return 1;
          if (!b.tanggal) return -1;
          return b.tanggal.localeCompare(a.tanggal);
        });
        
        setAttendanceData(allAttendance);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Fungsi untuk memformat waktu
  const formatWaktu = (waktuString) => {
    if (!waktuString) return "—";
    try {
      // Jika waktu sudah dalam format HH:MM:SS
      if (typeof waktuString === 'string' && waktuString.match(/^\d{2}:\d{2}:\d{2}$/)) return waktuString;
      
      // Jika waktu dalam format ISO
      const date = new Date(waktuString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      }
      return waktuString;
    } catch {
      return waktuString;
    }
  };

  // Fungsi untuk mendapatkan status
  const getStatus = (waktuString, shiftStart = "08:00:00") => {
    if (!waktuString) return "Belum Absen";
    try {
      const waktu = formatWaktu(waktuString);
      if (waktu === "—") return "Belum Absen";
      
      const getMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.toString().split(":");
        if (parts.length >= 2) {
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
      };
      
      const waktuMinutes = getMinutes(waktu);
      const shiftMinutes = getMinutes(shiftStart);
      
      if (waktuMinutes > shiftMinutes + 10) {
        return "Telat";
      }
      return "Tepat Waktu";
    } catch {
      return "Terekam";
    }
  };

  // Filter Data
  const filteredAttendance = attendanceData.filter((item) => {
    if (startDate && item.tanggal && item.tanggal < startDate) return false;
    if (endDate && item.tanggal && item.tanggal > endDate) return false;

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const matchNama = item.namaLengkap?.toLowerCase().includes(term);
      const matchJabatan = item.jabatan?.toLowerCase().includes(term);
      return matchNama || matchJabatan;
    }
    return true;
  });

  // Logika Export Excel
  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Tidak ada data absensi yang sesuai filter untuk di-export.",
        confirmButtonColor: "#740223"
      });
      return;
    }

    const dataToExport = filteredAttendance.map((item, index) => ({
      "No": index + 1,
      "Tanggal": item.tanggal || "—",
      "Nama Karyawan": item.namaLengkap || "—",
      "Jabatan": item.jabatan || "—",
      "Jam Masuk": item.absenMasuk?.waktu ? formatWaktu(item.absenMasuk.waktu) : "—",
      "Status Masuk": item.absenMasuk ? getStatus(item.absenMasuk.waktu) : "—",
      "Jam Pulang": item.absenPulang?.waktu ? formatWaktu(item.absenPulang.waktu) : "—",
      "Status Pulang": item.absenPulang ? getStatus(item.absenPulang.waktu, "16:00:00") : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kehadiran");

    const labelPeriode = startDate && endDate ? `${startDate}_s_d_${endDate}` : "Semua_Periode";
    XLSX.writeFile(workbook, `Laporan_Absensi_SAP_${labelPeriode}.xlsx`);

    Swal.fire({
      icon: "success",
      title: "Export Berhasil",
      text: `Berhasil mengunduh ${filteredAttendance.length} baris data absensi.`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Filter - Serasi dengan KaryawanTab */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filter Tanggal Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#740223]/10 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[#740223]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Periode</p>
              <p className="text-xs font-medium text-slate-500">Pilih rentang tanggal untuk melihat laporan</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 px-4 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:border-[#740223] transition shadow-sm"
              />
              <span className="text-[10px] font-bold text-slate-400 hidden sm:block">→</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 px-4 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:border-[#740223] transition shadow-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table Area - Serasi dengan KaryawanTab */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Rekapitulasi Kehadiran</h3>
          <div className="flex items-center gap-2">
            <span className="bg-[#740223]/5 text-[#740223] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Total: {filteredAttendance.length}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
              <Filter className="w-3 h-3" />
              <span>Terekspor</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#740223]" />
            <p className="text-xs font-semibold text-slate-400">Memuat Data Absensi...</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada data absensi ditemukan pada rentang filter ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filteredAttendance.map((item) => (
              <div key={item.id} className="p-4 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#740223]/10 to-[#740223]/5 flex items-center justify-center text-[#740223] font-bold text-sm shrink-0">
                    {item.namaLengkap?.charAt(0).toUpperCase() || "K"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-800 tracking-tight truncate">{item.namaLengkap}</h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {item.jabatan || "Staff"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.tanggal || "—"}
                      </p>
                      <div className="flex items-center gap-2">
                        {item.absenMasuk ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getStatus(item.absenMasuk.waktu) === "Telat" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {getStatus(item.absenMasuk.waktu)} • {formatWaktu(item.absenMasuk.waktu)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            Belum Masuk
                          </span>
                        )}
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        {item.absenPulang ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {formatWaktu(item.absenPulang.waktu)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            Belum Pulang
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAbsen(item)}
                  className="text-[10px] bg-slate-100 hover:bg-[#740223]/5 text-slate-600 hover:text-[#740223] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Detail
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL DETAIL ABSEN - Serasi dengan modal KaryawanTab */}
      {selectedAbsen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[65vh] overflow-hidden border border-slate-100 animate-fadeIn duration-150">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c5a85c]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Detail Validasi Absensi</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedAbsen(null)} 
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Identitas Pegawai */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identitas Pegawai</p>
                <h4 className="text-sm font-black text-slate-800">{selectedAbsen.namaLengkap}</h4>
                <p className="text-xs text-slate-500 font-semibold">{selectedAbsen.jabatan || "Karyawan Aktif"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] font-medium text-slate-500">{selectedAbsen.tanggal || "Tanggal tidak tersedia"}</p>
                </div>
              </div>

              {/* Log Absen Masuk */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Absen Masuk</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {selectedAbsen.absenMasuk ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400">Waktu</span>
                        <span className="text-xs font-bold text-slate-800">{formatWaktu(selectedAbsen.absenMasuk.waktu)} WIB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400">Status</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatus(selectedAbsen.absenMasuk.waktu) === "Telat" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {getStatus(selectedAbsen.absenMasuk.waktu)}
                        </span>
                      </div>
                      {selectedAbsen.absenMasuk.akurasi !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-slate-400">Akurasi</span>
                          <span className="text-xs font-bold text-slate-800">{selectedAbsen.absenMasuk.akurasi}%</span>
                        </div>
                      )}
                      {selectedAbsen.absenMasuk.koordinat && selectedAbsen.absenMasuk.koordinat.lat && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedAbsen.absenMasuk.koordinat.lat},${selectedAbsen.absenMasuk.koordinat.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#740223] bg-[#740223]/5 py-2 rounded-lg hover:bg-[#740223]/10 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Lihat Lokasi Maps
                        </a>
                      )}
                      {selectedAbsen.absenMasuk.fotoUrl && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Foto Absen</p>
                          <img 
                            src={selectedAbsen.absenMasuk.fotoUrl} 
                            alt="Foto Absen Masuk"
                            className="w-28 h-auto max-h-36 object-cover rounded-lg border border-slate-200 shadow-sm mx-auto"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/112x140?text=Foto+Tidak+Tersedia";
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">Belum melakukan absen masuk</p>
                  )}
                </div>
              </div>

              {/* Log Absen Pulang */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Absen Pulang</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {selectedAbsen.absenPulang ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400">Waktu</span>
                        <span className="text-xs font-bold text-slate-800">{formatWaktu(selectedAbsen.absenPulang.waktu)} WIB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400">Status</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatus(selectedAbsen.absenPulang.waktu, "16:00:00") === "Telat" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {getStatus(selectedAbsen.absenPulang.waktu, "16:00:00")}
                        </span>
                      </div>
                      {selectedAbsen.absenPulang.akurasi !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-slate-400">Akurasi</span>
                          <span className="text-xs font-bold text-slate-800">{selectedAbsen.absenPulang.akurasi}%</span>
                        </div>
                      )}
                      {selectedAbsen.absenPulang.koordinat && selectedAbsen.absenPulang.koordinat.lat && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedAbsen.absenPulang.koordinat.lat},${selectedAbsen.absenPulang.koordinat.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#740223] bg-[#740223]/5 py-2 rounded-lg hover:bg-[#740223]/10 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Lihat Lokasi Maps
                        </a>
                      )}
                      {selectedAbsen.absenPulang.fotoUrl && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Foto Absen</p>
                          <img 
                            src={selectedAbsen.absenPulang.fotoUrl} 
                            alt="Foto Absen Pulang"
                            className="w-28 h-auto max-h-36 object-cover rounded-lg border border-slate-200 shadow-sm mx-auto"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/112x140?text=Foto+Tidak+Tersedia";
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">Belum melakukan absen pulang</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end shrink-0 bg-white">
              <button 
                onClick={() => setSelectedAbsen(null)}
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