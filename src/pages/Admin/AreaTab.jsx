// AreaTab.jsx - Kelola Area (nama_area, lat, lng, isAktif)
// Field disesuaikan dengan struktur Firestore yang sudah berjalan.
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  MapPinned,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Navigation,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

const fieldLabel = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";
const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition";

const emptyForm = { nama_area: "", lat: "", lng: "", radius: "50", isAktif: true };

export default function AreaTab() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "areas"), orderBy("nama_area", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setAreas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredAreas = areas.filter((a) =>
    a.nama_area?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (area) => {
    setEditingId(area.id);
    setFormData({
      nama_area: area.nama_area || "",
      // Berjaga-jaga jika data lama masih tersimpan sebagai string
      lat: area.lat !== undefined && area.lat !== null ? String(area.lat) : "",
      lng: area.lng !== undefined && area.lng !== null ? String(area.lng) : "",
      radius: area.radius !== undefined && area.radius !== null ? String(area.radius) : "50",
      isAktif: area.isAktif !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const validateForm = () => {
    if (!formData.nama_area.trim()) {
      Swal.fire({ icon: "warning", title: "Nama area wajib diisi", confirmButtonColor: "#740223" });
      return false;
    }
    const latNum = Number(formData.lat);
    const lngNum = Number(formData.lng);
    if (formData.lat === "" || isNaN(latNum) || latNum < -90 || latNum > 90) {
      Swal.fire({ icon: "warning", title: "Latitude tidak valid", text: "Rentang latitude adalah -90 s/d 90.", confirmButtonColor: "#740223" });
      return false;
    }
    if (formData.lng === "" || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      Swal.fire({ icon: "warning", title: "Longitude tidak valid", text: "Rentang longitude adalah -180 s/d 180.", confirmButtonColor: "#740223" });
      return false;
    }
    const radiusNum = Number(formData.radius);
    if (formData.radius === "" || isNaN(radiusNum) || radiusNum <= 0) {
      Swal.fire({ icon: "warning", title: "Radius tidak valid", text: "Radius harus berupa angka lebih dari 0 meter.", confirmButtonColor: "#740223" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        nama_area: formData.nama_area.trim(),
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        radius: Number(formData.radius),
        isAktif: !!formData.isAktif,
      };

      if (editingId) {
        await updateDoc(doc(db, "areas", editingId), {
          ...payload,
          updated_at: serverTimestamp(),
        });
        Swal.fire({ icon: "success", title: "Area berhasil diperbarui", timer: 1400, showConfirmButton: false });
      } else {
        await addDoc(collection(db, "areas"), {
          ...payload,
          created_at: serverTimestamp(),
        });
        Swal.fire({ icon: "success", title: "Area berhasil ditambahkan", timer: 1400, showConfirmButton: false });
      }

      closeForm();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal menyimpan area", text: err.message, confirmButtonColor: "#740223" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAktif = async (area) => {
    try {
      await updateDoc(doc(db, "areas", area.id), {
        isAktif: !(area.isAktif !== false),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal mengubah status", text: err.message, confirmButtonColor: "#740223" });
    }
  };

  const handleDelete = async (area) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus Area?",
      html: `Area <b>${area.nama_area}</b> akan dihapus permanen dan tidak dapat dikembalikan.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "areas", area.id));
      Swal.fire({ icon: "success", title: "Area berhasil dihapus", timer: 1400, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal menghapus area", text: err.message, confirmButtonColor: "#740223" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#740223]/5 text-[#740223] flex items-center justify-center">
              <MapPinned className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Kelola Area</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Kelola daftar titik area (nama, koordinat, status) untuk penandaan lokasi karyawan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="bg-[#740223] hover:bg-[#5a011a] text-white font-bold text-[11px] uppercase tracking-wider px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#c5a85c]" />
            Tambah Area
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
          />
        </div>
      </Card>

      {/* List Area */}
      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#740223]" />
          <p className="text-xs font-semibold text-slate-400">Memuat Data Area...</p>
        </Card>
      ) : filteredAreas.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-2 text-center">
          <MapPinned className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-500">Belum ada data area</p>
          <p className="text-[11px] text-slate-400">Klik "Tambah Area" untuk menambahkan area baru.</p>
        </Card>
      ) : (
        <>
          {/* Tabel - Desktop */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Area</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Latitude</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Longitude</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Radius</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area) => {
                    const aktif = area.isAktif !== false;
                    return (
                      <tr key={area.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#740223]/5 text-[#740223] flex items-center justify-center shrink-0">
                              <a href={`https://www.google.com/maps/search/?api=1&query=${area.lat},${area.lng}`}><Navigation className="w-3.5 h-3.5" /></a>
                            </div>
                            <span className="text-xs font-bold text-slate-800">{area.nama_area}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-600">{area.lat}</td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-600">{area.lng}</td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-600">{area.radius ?? "—"} m</td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAktif(area)}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider transition cursor-pointer ${
                              aktif
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100"
                                : "text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {aktif ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {aktif ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(area)}
                              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition cursor-pointer"
                              title="Edit Area"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(area)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition cursor-pointer"
                              title="Hapus Area"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* List - Mobile */}
          <div className="md:hidden space-y-3">
            {filteredAreas.map((area) => {
              const aktif = area.isAktif !== false;
              return (
                <Card key={area.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#740223]/5 text-[#740223] flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{area.nama_area}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {area.lat}, {area.lng} • Radius {area.radius ?? "—"}m
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAktif(area)}
                      className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1.5 rounded-full uppercase tracking-wider shrink-0 cursor-pointer ${
                        aktif ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-slate-500 bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {aktif ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {aktif ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openEditForm(area)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(area)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {editingId ? "Edit Area" : "Tambah Area Baru"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={fieldLabel}>Nama Area</label>
                <input
                  type="text"
                  placeholder="Contoh: Kantor Pusat Jakarta"
                  value={formData.nama_area}
                  onChange={(e) => setFormData({ ...formData, nama_area: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-6.2000"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="106.8166"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabel}>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3 h-3" /> Radius Maksimal
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="50"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    className={`${inputCls} pr-16`}
                    required
                  />
                  <span className="absolute right-4 top-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Meter</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Radius minimal yang direkomendasikan adalah 50 meter
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">Status Area</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Nonaktifkan jika area belum/tidak digunakan</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAktif: !formData.isAktif })}
                  className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${
                    formData.isAktif ? "bg-[#740223]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      formData.isAktif ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#740223] hover:bg-[#5a011a] disabled:opacity-60 text-white font-bold text-[11px] uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Simpan Perubahan" : "Tambah Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}