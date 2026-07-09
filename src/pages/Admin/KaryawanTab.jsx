import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  Search, FileSpreadsheet, Loader2, X, Save, Trash2,
  User, Phone, Mail, Hash, Briefcase, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, MapPin, Heart, Users, Calendar,
  UserX, UserCheck
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>{children}</div>
);

const Label = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition";
const fieldLabel = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";

export default function KaryawanTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAktif, setFilterAktif] = useState("aktif"); // "aktif" | "nonaktif" | "semua"

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("pribadi");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users: ", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleExportExcel = () => {
    const exportSource = users.filter((u) => u.isAktif !== false);
    if (exportSource.length === 0) {
      Swal.fire({ icon: "warning", title: "Gagal Export", text: "Tidak ada data karyawan aktif untuk diexport.", confirmButtonColor: "#740223" });
      return;
    }

    const dataToExport = exportSource.map((u, index) => {
      const pribadi = u.dataPribadi || {};
      const keluarga = u.dataKeluarga || {};
      const daftarAnak = keluarga.daftarAnak || [];
      const stringDataAnak = daftarAnak.length > 0
        ? daftarAnak.map((anak, i) => `${i + 1}. ${anak.namaAnak || '—'} (Tempat: ${anak.tempatLahirAnak || '—'}, Tgl: ${anak.tanggalLahirAnak || '—'})`).join("\n")
        : "—";

      return {
        "No": index + 1,
        "Nama Lengkap": u.namaLengkap || "—",
        "NIK": u.nik || "—",
        "Jabatan": u.jabatan || "—",
        "No. Telp / WA": u.noHandphone || "—",
        "Email Kantor": u.email || "—",
        "Tempat Lahir": pribadi.tempatLahir || "—",
        "Tanggal Lahir": pribadi.tanggalLahir || "—",
        "Jenis Kelamin": pribadi.gender || "—",
        "Agama": pribadi.agama || "—",
        "Pendidikan Terakhir": pribadi.pendidikanTerakhir || "—",
        "Alamat KTP": pribadi.alamatKtp || "—",
        "Alamat Domisili": pribadi.alamatSekarang || "—",
        "Nama Ayah": pribadi.namaAyah || "—",
        "Nama Ibu": pribadi.namaIbu || "—",
        "Status Pernikahan": pribadi.statusPernikahan || "Belum Kawin",
        "Nama Pasangan": keluarga.namaPasangan || "—",
        "Tempat Lahir Pasangan": keluarga.tempatLahirPasangan || "—",
        "Tanggal Lahir Pasangan": keluarga.tanggalLahirPasangan || "—",
        "Pekerjaan Pasangan": keluarga.pekerjaanPasangan || "—",
        "Alamat Pasangan": keluarga.alamatPasangan || "—",
        "Jumlah Anak": keluarga.jumlahAnak || "0",
        "Daftar Anak (Nama, Tempat, Tgl Lahir)": stringDataAnak,
        "Role Akses Sistem": u.role || "karyawan",
        "Profile Lengkap": u.isProfileComplete ? "Ya" : "Tidak"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Karyawan & Keluarga");
    XLSX.writeFile(workbook, `Rekap_Karyawan_SAP_${new Date().toISOString().split('T')[0]}.xlsx`);

    Swal.fire({ icon: "success", title: "Export Berhasil!", text: "Seluruh data karyawan aktif telah diunduh ke Excel.", timer: 2000, showConfirmButton: false });
  };

  // Filter berdasarkan search dan status aktif
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchSearch =
      u.namaLengkap?.toLowerCase().includes(term) ||
      u.jabatan?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);

    const isAktif = u.isAktif !== false; // default aktif jika field belum ada
    const matchAktif =
      filterAktif === "semua" ||
      (filterAktif === "aktif" && isAktif) ||
      (filterAktif === "nonaktif" && !isAktif);

    return matchSearch && matchAktif;
  });

  const getEditFormData = (user) => {
    const pribadi = user.dataPribadi || {};
    const keluarga = user.dataKeluarga || {};
    return {
      id: user.id,
      namaLengkap: user.namaLengkap || "",
      nik: user.nik || "",
      jabatan: user.jabatan || "",
      noHandphone: user.noHandphone || "",
      email: user.email || "",
      role: user.role || "karyawan",
      tempatLahir: pribadi.tempatLahir || "",
      tanggalLahir: pribadi.tanggalLahir || "",
      gender: pribadi.gender || "",
      agama: pribadi.agama || "",
      statusPernikahan: pribadi.statusPernikahan || "Belum Kawin",
      alamatKtp: pribadi.alamatKtp || "",
      alamatSekarang: pribadi.alamatSekarang || "",
      namaAyah: pribadi.namaAyah || "",
      namaIbu: pribadi.namaIbu || "",
      pendidikanTerakhir: pribadi.pendidikanTerakhir || "",
      namaPasangan: keluarga.namaPasangan || "",
      tempatLahirPasangan: keluarga.tempatLahirPasangan || "",
      tanggalLahirPasangan: keluarga.tanggalLahirPasangan || "",
      pekerjaanPasangan: keluarga.pekerjaanPasangan || "",
      alamatPasangan: keluarga.alamatPasangan || "",
      jumlahAnak: keluarga.jumlahAnak || "0",
      daftarAnak: keluarga.daftarAnak || []
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, "users", selectedUser.id);
      const updateData = {
        namaLengkap: editForm.namaLengkap,
        nik: editForm.nik,
        jabatan: editForm.jabatan,
        noHandphone: editForm.noHandphone,
        role: editForm.role,
        dataPribadi: {
          tempatLahir: editForm.tempatLahir,
          tanggalLahir: editForm.tanggalLahir,
          gender: editForm.gender,
          agama: editForm.agama,
          statusPernikahan: editForm.statusPernikahan,
          alamatKtp: editForm.alamatKtp,
          alamatSekarang: editForm.alamatSekarang,
          namaAyah: editForm.namaAyah,
          namaIbu: editForm.namaIbu,
          pendidikanTerakhir: editForm.pendidikanTerakhir,
        },
        dataKeluarga: editForm.statusPernikahan === "Belum Kawin"
          ? { namaPasangan: "", tempatLahirPasangan: "", tanggalLahirPasangan: "", pekerjaanPasangan: "", alamatPasangan: "", jumlahAnak: "0", daftarAnak: [] }
          : { namaPasangan: editForm.namaPasangan, tempatLahirPasangan: editForm.tempatLahirPasangan, tanggalLahirPasangan: editForm.tanggalLahirPasangan, pekerjaanPasangan: editForm.pekerjaanPasangan, alamatPasangan: editForm.alamatPasangan, jumlahAnak: editForm.jumlahAnak, daftarAnak: editForm.daftarAnak },
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updateData);
      setSaving(false);
      setSelectedUser(null);
      Swal.fire({ icon: "success", title: "Berhasil memperbarui data", timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      setSaving(false);
      Swal.fire({ icon: "error", title: "Gagal menyimpan perubahan", text: err.message });
    }
  };

  // ── Nonaktifkan (soft delete) ─────────────────────────────
  const handleDeactivate = (user) => {
    Swal.fire({
      title: "Nonaktifkan Karyawan?",
      html: `Akun <b>${user.namaLengkap}</b> akan dinonaktifkan.<br>Data tetap tersimpan dan bisa diaktifkan kembali.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#740223",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Nonaktifkan",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateDoc(doc(db, "users", user.id), {
            isAktif: false,
            nonaktifPada: new Date().toISOString(),
          });
          setSelectedUser(null);
          Swal.fire({ icon: "success", title: "Karyawan Dinonaktifkan", text: `${user.namaLengkap} berhasil dinonaktifkan.`, timer: 1800, showConfirmButton: false });
        } catch (error) {
          Swal.fire({ icon: "error", title: "Gagal", text: "Terjadi kesalahan saat menonaktifkan karyawan." });
        }
      }
    });
  };

  // ── Aktifkan kembali ─────────────────────────────────────
  const handleActivate = (user) => {
    Swal.fire({
      title: "Aktifkan Kembali?",
      html: `Akun <b>${user.namaLengkap}</b> akan diaktifkan kembali.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateDoc(doc(db, "users", user.id), {
            isAktif: true,
            nonaktifPada: null,
          });
          setSelectedUser(null);
          Swal.fire({ icon: "success", title: "Karyawan Diaktifkan", text: `${user.namaLengkap} berhasil diaktifkan kembali.`, timer: 1800, showConfirmButton: false });
        } catch (error) {
          Swal.fire({ icon: "error", title: "Gagal", text: "Terjadi kesalahan saat mengaktifkan karyawan." });
        }
      }
    });
  };

  const handleAnakChangeByAdmin = (index, field, value) => {
    const updatedAnak = [...(editForm.daftarAnak || [])];
    updatedAnak[index] = { ...updatedAnak[index], [field]: value };
    setEditForm({ ...editForm, daftarAnak: updatedAnak });
  };

  const isUserAktif = selectedUser?.isAktif !== false;

  return (
    <div className="space-y-5">
      {/* Header Aksi */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan, email, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {/* Filter aktif/nonaktif */}
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-[10px] font-bold uppercase tracking-wider shrink-0">
            {[
              { key: "aktif", label: "Aktif" },
              { key: "nonaktif", label: "Nonaktif" },
              { key: "semua", label: "Semua" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterAktif(key)}
                className={`px-3 py-2.5 transition cursor-pointer ${
                  filterAktif === key
                    ? "bg-[#740223] text-white"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* List Karyawan */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Daftar Karyawan {filterAktif === "aktif" ? "Aktif" : filterAktif === "nonaktif" ? "Nonaktif" : "Semua"}
          </h3>
          <span className="bg-[#740223]/5 text-[#740223] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Total: {filteredUsers.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#740223]" />
            <p className="text-xs font-semibold text-slate-400">Memuat Data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada data karyawan ditemukan.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filteredUsers.map((u) => {
              const aktif = u.isAktif !== false;
              return (
                <div key={u.id} className={`p-4 flex items-center justify-between transition ${aktif ? "hover:bg-slate-50/80" : "bg-slate-50/60 opacity-70"}`}>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${aktif ? "bg-gradient-to-br from-[#740223]/10 to-[#740223]/5 text-[#740223]" : "bg-slate-200 text-slate-400"}`}>
                      {u.namaLengkap?.charAt(0).toUpperCase() || "K"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-800 tracking-tight truncate">{u.namaLengkap}</h4>
                        {!aktif && (
                          <span className="text-[9px] font-extrabold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Nonaktif</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider mt-0.5">{u.jabatan || "Staff"} • {u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setEditForm(getEditFormData(u));
                      setModalMode("view");
                      setActiveSection("pribadi");
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-[#740223]/5 text-slate-600 hover:text-[#740223] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Kelola
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[65vh] overflow-hidden border border-slate-100">

            {/* Banner nonaktif */}
            {!isUserAktif && (
              <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center gap-2">
                <UserX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Akun ini sedang dinonaktifkan
                  {selectedUser.nonaktifPada ? ` sejak ${new Date(selectedUser.nonaktifPada).toLocaleDateString("id-ID")}` : ""}
                </p>
              </div>
            )}

            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isUserAktif ? "bg-[#c5a85c]" : "bg-slate-400"}`} />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {modalMode === "view" ? "Detail Profil Karyawan" : "Ubah Data Karyawan"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isUserAktif && (
                  <button
                    onClick={() => setModalMode(modalMode === "view" ? "edit" : "view")}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer bg-[#740223]/5 text-[#740223] hover:bg-[#740223]/10"
                  >
                    {modalMode === "view" ? "Mode Edit" : "Batal Edit"}
                  </button>
                )}
                <button onClick={() => setSelectedUser(null)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 pt-3 flex gap-3 border-b border-slate-50 shrink-0 bg-slate-50/40">
              <button onClick={() => setActiveSection("pribadi")}
                className={`pb-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${activeSection === "pribadi" ? "border-[#740223] text-[#740223]" : "border-transparent text-slate-400"}`}>
                Data Pribadi
              </button>
              <button onClick={() => setActiveSection("keluarga")}
                className={`pb-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${activeSection === "keluarga" ? "border-[#740223] text-[#740223]" : "border-transparent text-slate-400"}`}>
                Susunan Keluarga
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeSection === "pribadi" ? (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Nama Lengkap</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.namaLengkap || ""} onChange={(e) => setEditForm({...editForm, namaLengkap: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>NIK</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.nik || ""} onChange={(e) => setEditForm({...editForm, nik: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Jabatan</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.jabatan || ""} onChange={(e) => setEditForm({...editForm, jabatan: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>No. WhatsApp</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.noHandphone || ""} onChange={(e) => setEditForm({...editForm, noHandphone: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>Email</label>
                    <input type="email" disabled value={editForm.email || ""} className={`${inputCls} opacity-60 bg-slate-100`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Tempat Lahir</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.tempatLahir || ""} onChange={(e) => setEditForm({...editForm, tempatLahir: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Tanggal Lahir</label>
                      <input type="date" disabled={modalMode === "view"} value={editForm.tanggalLahir || ""} onChange={(e) => setEditForm({...editForm, tanggalLahir: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Jenis Kelamin</label>
                      <select disabled={modalMode === "view"} value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} className={inputCls}>
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className={fieldLabel}>Agama</label>
                      <select disabled={modalMode === "view"} value={editForm.agama} onChange={(e) => setEditForm({...editForm, agama: e.target.value})} className={inputCls}>
                        <option value="">Pilih Jenis Agama</option>
                        <option>Islam</option>
                        <option>Kristen Protestan</option>
                        <option>Katolik</option>
                        <option>Hindu</option>
                        <option>Buddha</option>
                        <option>Khonghucu</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>Pendidikan Terakhir</label>
                    <input type="text" disabled={modalMode === "view"} value={editForm.pendidikanTerakhir || ""} onChange={(e) => setEditForm({...editForm, pendidikanTerakhir: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className={fieldLabel}>Alamat KTP</label>
                    <textarea rows="2" disabled={modalMode === "view"} value={editForm.alamatKtp || ""} onChange={(e) => setEditForm({...editForm, alamatKtp: e.target.value})} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={fieldLabel}>Alamat Domisili</label>
                    <textarea rows="2" disabled={modalMode === "view"} value={editForm.alamatSekarang || ""} onChange={(e) => setEditForm({...editForm, alamatSekarang: e.target.value})} className={`${inputCls} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Nama Ayah</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.namaAyah || ""} onChange={(e) => setEditForm({...editForm, namaAyah: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Nama Ibu</label>
                      <input type="text" disabled={modalMode === "view"} value={editForm.namaIbu || ""} onChange={(e) => setEditForm({...editForm, namaIbu: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>Role Sistem</label>
                    <select disabled={modalMode === "view"} value={editForm.role || "karyawan"} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className={inputCls}>
                      <option value="karyawan">Karyawan</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={fieldLabel}>Status Pernikahan</label>
                    <select disabled={modalMode === "view"} value={editForm.statusPernikahan || "Belum Kawin"} onChange={(e) => setEditForm({...editForm, statusPernikahan: e.target.value})} className={inputCls}>
                      <option value="Belum Kawin">Belum Kawin (Lajang)</option>
                      <option value="Kawin">Kawin (Menikah)</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>

                  {editForm.statusPernikahan !== "Belum Kawin" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={fieldLabel}>Nama Pasangan</label>
                          <input type="text" disabled={modalMode === "view"} value={editForm.namaPasangan || ""} onChange={(e) => setEditForm({...editForm, namaPasangan: e.target.value})} className={inputCls} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Pekerjaan Pasangan</label>
                          <input type="text" disabled={modalMode === "view"} value={editForm.pekerjaanPasangan || ""} onChange={(e) => setEditForm({...editForm, pekerjaanPasangan: e.target.value})} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={fieldLabel}>Tempat Lahir Pasangan</label>
                          <input type="text" disabled={modalMode === "view"} value={editForm.tempatLahirPasangan || ""} onChange={(e) => setEditForm({...editForm, tempatLahirPasangan: e.target.value})} className={inputCls} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Tanggal Lahir Pasangan</label>
                          <input type="date" disabled={modalMode === "view"} value={editForm.tanggalLahirPasangan || ""} onChange={(e) => setEditForm({...editForm, tanggalLahirPasangan: e.target.value})} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={fieldLabel}>Alamat Pasangan</label>
                        <textarea rows="2" disabled={modalMode === "view"} value={editForm.alamatPasangan || ""} onChange={(e) => setEditForm({...editForm, alamatPasangan: e.target.value})} className={`${inputCls} resize-none`} />
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label>Daftar Anak Kandung</Label>
                          <div className="w-24">
                            <label className={fieldLabel}>Jumlah Anak</label>
                            <input
                              type="number" min="0" max="15" disabled={modalMode === "view"}
                              value={editForm.jumlahAnak || "0"}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                const prev = editForm.daftarAnak || [];
                                const daftarAnak = count > prev.length
                                  ? [...prev, ...Array.from({ length: count - prev.length }, () => ({ namaAnak: "", tempatLahirAnak: "", tanggalLahirAnak: "" }))]
                                  : prev.slice(0, count);
                                setEditForm({ ...editForm, jumlahAnak: count.toString(), daftarAnak });
                              }}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        {editForm.daftarAnak && editForm.daftarAnak.length > 0 ? (
                          <div className="space-y-3 mt-2">
                            {editForm.daftarAnak.map((anak, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-extrabold text-[#740223] bg-[#740223]/5 px-2 py-0.5 rounded-md">Anak Ke-{idx + 1}</span>
                                  <Users className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Anak</label>
                                    <input type="text" disabled={modalMode === "view"} value={anak.namaAnak || ""} onChange={(e) => handleAnakChangeByAdmin(idx, "namaAnak", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Tempat Lahir</label>
                                    <input type="text" disabled={modalMode === "view"} value={anak.tempatLahirAnak || ""} onChange={(e) => handleAnakChangeByAdmin(idx, "tempatLahirAnak", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Tanggal Lahir</label>
                                    <input type="date" disabled={modalMode === "view"} value={anak.tanggalLahirAnak || ""} onChange={(e) => handleAnakChangeByAdmin(idx, "tanggalLahirAnak", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic mt-2">Belum ada data anak yang didaftarkan.</p>
                        )}
                      </div>
                    </>
                  )}

                  {editForm.statusPernikahan === "Belum Kawin" && (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl flex gap-2 text-xs">
                      <Heart className="w-4 h-4 text-[#c5a85c] shrink-0 mt-0.5" />
                      <p>Status Belum Menikah, form pasangan dan anak tidak perlu diisi.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
              {/* Tombol nonaktif / aktifkan */}
              {isUserAktif ? (
                <button
                  onClick={() => handleDeactivate(selectedUser)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer transition"
                >
                  <UserX className="w-3.5 h-3.5" /> Nonaktifkan Karyawan
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(selectedUser)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider cursor-pointer transition"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Aktifkan Kembali
                </button>
              )}

              {modalMode === "edit" && isUserAktif && (
                <button onClick={handleSave} disabled={saving}
                  className="bg-[#740223] hover:bg-[#5a011a] disabled:opacity-60 text-white font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#c5a85c]" />}
                  <span>Simpan</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}