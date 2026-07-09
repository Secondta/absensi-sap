// PengaturanKantor.jsx - Perbaikan konsistensi UI
import { useState } from "react";
import { MapPin, Sliders, Save, Navigation, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>{children}</div>
);

const fieldLabel = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";
const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition";

export default function PengaturanKantor() {
  const [config, setConfig] = useState({ lat: "-6.2000", lng: "106.8166", radius: "50" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulasi simpan
    await new Promise(resolve => setTimeout(resolve, 1000));
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Konfigurasi geofencing kantor telah disimpan.",
      timer: 1500,
      showConfirmButton: false
    });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center gap-3 pb-5 mb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#740223]/5 text-[#740223] flex items-center justify-center">
            <Sliders className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Geofencing Parameter (Belum Diterapkan)</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tentukan koordinat pusat kantor dan radius jangkauan absen</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Latitude
                </div>
              </label>
              <input type="text" value={config.lat} onChange={(e) => setConfig({...config, lat: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={fieldLabel}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Longitude
                </div>
              </label>
              <input type="text" value={config.lng} onChange={(e) => setConfig({...config, lng: e.target.value})} className={inputCls} required />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3" /> Radius Maksimal
              </div>
            </label>
            <div className="relative">
              <input type="number" value={config.radius} onChange={(e) => setConfig({...config, radius: e.target.value})} className={`${inputCls} pr-16`} required />
              <span className="absolute right-4 top-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Meter</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Radius minimal yang direkomendasikan adalah 50 meter
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-[#740223] hover:bg-[#5a011a] disabled:opacity-60 text-white font-bold text-[11px] uppercase tracking-wider px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer">
              <Save className="w-3.5 h-3.5 text-[#c5a85c]" />
              {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}