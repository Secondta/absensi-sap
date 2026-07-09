// HomeTab.jsx - Dashboard yang lebih bersih
import { useState, useEffect } from "react";
import { Users, CheckCircle2, Clock, Calendar, Loader2, TrendingUp, UserCheck } from "lucide-react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

export default function AdminHomeTab({ time }) {
  const [summary, setSummary] = useState({ totalKaryawan: 0, hadir: 0, terlambat: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("en-CA");

    let unsubscribeUsers = () => {};
    let unsubscribeAttendance = () => {};

    try {
      unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnapshot) => {
        const totalKaryawanCount = usersSnapshot.size;

        unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (attendanceSnapshot) => {
          let tepatWaktuCount = 0;
          let terlambatCount = 0;

          attendanceSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tanggal === todayStr && data.absenMasuk) {
              if (data.absenMasuk.status === "Tepat Waktu") {
                tepatWaktuCount++;
              } else if (data.absenMasuk.status === "Terlambat") {
                terlambatCount++;
              }
            }
          });

          setSummary({
            totalKaryawan: totalKaryawanCount,
            hadir: tepatWaktuCount,
            terlambat: terlambatCount,
          });
          setLoading(false);
        });
      });
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }

    return () => {
      unsubscribeUsers();
      unsubscribeAttendance();
    };
  }, []);

  const formatTime = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-5">
      {/* Card Waktu */}
      <Card className="p-5 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#740223]/10 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[#740223]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hari Ini</p>
              <p className="text-sm font-bold text-slate-700">
                {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-[#c5a85c]" />
            <span className="text-xs font-bold text-slate-700">{formatTime(time)} WIB</span>
          </div>
        </div>
      </Card>

      {/* Statistik Grid */}
      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#740223]" />
          <p className="text-xs font-semibold text-slate-400">Memuat Data...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 hover:border-[#740223]/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800">{summary.totalKaryawan}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Karyawan Terdaftar</p>
            </div>
          </Card>

          <Card className="p-5 hover:border-emerald-200/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tepat Waktu</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-emerald-600">{summary.hadir}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Karyawan Hadir</p>
            </div>
          </Card>

          <Card className="p-5 hover:border-amber-200/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terlambat</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-amber-600">{summary.terlambat}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Karyawan Terlambat</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}