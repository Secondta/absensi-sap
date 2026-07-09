// ProfileTab.jsx - (UI disesuaikan dengan style Admin)
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { User, Users, Heart, Save, AlertCircle, Loader2, PlusCircle, CheckCircle, Calendar, Clock } from "lucide-react";

// ── Shared design tokens (sama persis dengan Admin) ────────
const Label = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#740223] focus:ring-2 focus:ring-[#740223]/10 transition";
const fieldLabel = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";

export default function ProfileTab({ time }) {
  const { userProfile, setUserProfile } = useAuth();

  const formatTime = (d) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) =>
    d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  
  const [activeSubTab, setActiveSubTab] = useState("pribadi");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [pribadiForm, setPribadiForm] = useState({
    tempatLahir: "", tanggalLahir: "", gender: "Laki-laki", agama: "Islam",
    statusPernikahan: "Belum Kawin", alamatKtp: "", alamatSekarang: "",
    namaAyah: "", namaIbu: "", pendidikanTerakhir: "",
  });

  const [keluargaForm, setKeluargaForm] = useState({
    namaPasangan: "", tempatLahirPasangan: "", tanggalLahirPasangan: "",
    pekerjaanPasangan: "", alamatPasangan: "", jumlahAnak: "0",
  });

  const [daftarAnak, setDaftarAnak] = useState([]);

  useEffect(() => {
    async function load() {
      if (!userProfile?.uid) return;
      try {
        const snap = await getDoc(doc(db, "users", userProfile.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.dataPribadi) setPribadiForm((p) => ({ ...p, ...d.dataPribadi }));
          if (d.dataKeluarga) {
            setKeluargaForm({
              namaPasangan: d.dataKeluarga.namaPasangan || "",
              tempatLahirPasangan: d.dataKeluarga.tempatLahirPasangan || "",
              tanggalLahirPasangan: d.dataKeluarga.tanggalLahirPasangan || "",
              pekerjaanPasangan: d.dataKeluarga.pekerjaanPasangan || "",
              alamatPasangan: d.dataKeluarga.alamatPasangan || "",
              jumlahAnak: d.dataKeluarga.jumlahAnak || "0",
            });
            if (d.dataKeluarga.daftarAnak) setDaftarAnak(d.dataKeluarga.daftarAnak);
          }
        }
      } catch (err) { console.error(err); }
      finally { setFetching(false); }
    }
    load();
  }, [userProfile]);

  const handlePribadiChange = (e) => setPribadiForm({ ...pribadiForm, [e.target.name]: e.target.value });

  const handleKeluargaChange = (e) => {
    const { name, value } = e.target;
    setKeluargaForm({ ...keluargaForm, [name]: value });
    if (name === "jumlahAnak") {
      const count = parseInt(value) || 0;
      setDaftarAnak((prev) => {
        if (count > prev.length) {
          const extra = Array.from({ length: count - prev.length }, () => ({ namaAnak: "", tempatLahirAnak: "", tanggalLahirAnak: "" }));
          return [...prev, ...extra];
        }
        return prev.slice(0, count);
      });
    }
  };

  const handleAnakChange = (i, field, val) => {
    const updated = [...daftarAnak];
    updated[i][field] = val;
    setDaftarAnak(updated);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const totalAnak = pribadiForm.statusPernikahan === "Belum Kawin" ? 0 : (parseInt(keluargaForm.jumlahAnak) || 0);
      const payload = {
        dataPribadi: pribadiForm,
        dataKeluarga: pribadiForm.statusPernikahan === "Belum Kawin"
          ? { namaPasangan: "", tempatLahirPasangan: "", tanggalLahirPasangan: "", pekerjaanPasangan: "", alamatPasangan: "", jumlahAnak: "0", daftarAnak: [] }
          : { ...keluargaForm, jumlahAnak: totalAnak.toString(), daftarAnak: daftarAnak.slice(0, totalAnak) },
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, "users", userProfile.uid), payload);
      if (setUserProfile) setUserProfile((p) => ({ ...p, ...payload }));
      setMessage({ type: "success", text: "Biodata berhasil disimpan!" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengunggah biodata ke server." });
    } finally { setLoading(false); }
  };

  if (fetching) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#740223] animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Sinkronisasi data profil...</p>
      </Card>
    );
  }

  const isSudahMenikah = pribadiForm.statusPernikahan !== "Belum Kawin";

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

      {/* Notifikasi */}
      {message.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 font-semibold ${
          message.type === "success"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-red-50 border-red-100 text-red-800"
        }`}>
          {message.type === "success"
            ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sub-tab Switcher */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-100 flex gap-1">
        {[
          { id: "pribadi", label: "Data Pribadi", icon: User },
          { id: "keluarga", label: "Data Keluarga", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSubTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
              activeSubTab === id
                ? "bg-[#740223] text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSaveProfile}>
        <Card className="p-5 md:p-6 space-y-5">

          {/* Tab Data Pribadi */}
          {activeSubTab === "pribadi" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-1 h-4 bg-[#c5a85c] rounded-full" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Identitas Diri Karyawan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Tempat Lahir</label>
                  <input type="text" name="tempatLahir" required placeholder="Contoh: Semarang"
                    value={pribadiForm.tempatLahir} onChange={handlePribadiChange} className={inputCls} />
                </div>
                <div>
                  <label className={fieldLabel}>Tanggal Lahir</label>
                  <input type="date" name="tanggalLahir" required
                    value={pribadiForm.tanggalLahir} onChange={handlePribadiChange} className={inputCls} />
                </div>
                <div>
                  <label className={fieldLabel}>Jenis Kelamin</label>
                  <select name="gender" value={pribadiForm.gender} onChange={handlePribadiChange} className={inputCls}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Agama</label>
                  <select name="agama" value={pribadiForm.agama} onChange={handlePribadiChange} className={inputCls}>
                    <option>Islam</option>
                    <option>Kristen Protestan</option>
                    <option>Katolik</option>
                    <option>Hindu</option>
                    <option>Buddha</option>
                    <option>Khonghucu</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Status Pernikahan</label>
                  <select name="statusPernikahan" value={pribadiForm.statusPernikahan} onChange={handlePribadiChange} className={inputCls}>
                    <option value="Belum Kawin">Belum Kawin (Lajang)</option>
                    <option value="Kawin">Kawin (Menikah)</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Pendidikan Terakhir</label>
                  <input type="text" name="pendidikanTerakhir" required placeholder="Contoh: SMK, S1 Teknik Informatika..."
                    value={pribadiForm.pendidikanTerakhir} onChange={handlePribadiChange} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Alamat Sesuai KTP</label>
                <textarea name="alamatKtp" required rows="2" placeholder="Alamat lengkap sesuai KTP..."
                  value={pribadiForm.alamatKtp} onChange={handlePribadiChange} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={fieldLabel}>Alamat Domisili Sekarang</label>
                <textarea name="alamatSekarang" required rows="2" placeholder="Alamat tinggal saat ini..."
                  value={pribadiForm.alamatSekarang} onChange={handlePribadiChange} className={`${inputCls} resize-none`} />
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Nama Ayah Kandung</label>
                  <input type="text" name="namaAyah" required placeholder="Nama lengkap ayah"
                    value={pribadiForm.namaAyah} onChange={handlePribadiChange} className={inputCls} />
                </div>
                <div>
                  <label className={fieldLabel}>Nama Ibu Kandung</label>
                  <input type="text" name="namaIbu" required placeholder="Nama lengkap ibu"
                    value={pribadiForm.namaIbu} onChange={handlePribadiChange} className={inputCls} />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => setActiveSubTab("keluarga")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition cursor-pointer">
                  Lanjut ke Data Keluarga →
                </button>
              </div>
            </div>
          )}

          {/* Tab Data Keluarga */}
          {activeSubTab === "keluarga" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-1 h-4 bg-[#c5a85c] rounded-full" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Informasi Keluarga</h3>
              </div>

              {!isSudahMenikah ? (
                <div className="bg-amber-50 border border-amber-100 text-amber-900 p-5 rounded-xl flex gap-3 text-xs leading-relaxed">
                  <Heart className="w-5 h-5 text-[#c5a85c] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Status Anda: Belum Menikah</p>
                    <p className="text-slate-500 mt-1">
                      Form data suami/istri dan anak dikunci otomatis. Anda bisa langsung menekan tombol simpan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabel}>Nama Suami / Istri</label>
                      <input type="text" name="namaPasangan" required={isSudahMenikah} placeholder="Nama lengkap pasangan"
                        value={keluargaForm.namaPasangan} onChange={handleKeluargaChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Pekerjaan Suami / Istri</label>
                      <input type="text" name="pekerjaanPasangan" required={isSudahMenikah} placeholder="Pekerjaan pasangan"
                        value={keluargaForm.pekerjaanPasangan} onChange={handleKeluargaChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Tempat Lahir Pasangan</label>
                      <input type="text" name="tempatLahirPasangan" required={isSudahMenikah} placeholder="Kota lahir pasangan"
                        value={keluargaForm.tempatLahirPasangan} onChange={handleKeluargaChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Tanggal Lahir Pasangan</label>
                      <input type="date" name="tanggalLahirPasangan" required={isSudahMenikah}
                        value={keluargaForm.tanggalLahirPasangan} onChange={handleKeluargaChange} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>Alamat Pasangan</label>
                    <textarea name="alamatPasangan" required={isSudahMenikah} rows="2" placeholder="Alamat tinggal pasangan..."
                      value={keluargaForm.alamatPasangan} onChange={handleKeluargaChange} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              )}

              {/* Jumlah Anak */}
              {pribadiForm.statusPernikahan !== "Belum Kawin" && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="w-full md:w-1/3">
                    <label className={fieldLabel}>Jumlah Anak Kandung</label>
                    <input type="number" name="jumlahAnak" min="0" max="15" required
                      value={keluargaForm.jumlahAnak} onChange={handleKeluargaChange} className={inputCls} />
                  </div>

                  {daftarAnak.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <PlusCircle className="w-4 h-4 text-[#c5a85c]" />
                        <Label>Biodata Anak Kandung</Label>
                      </div>
                      {daftarAnak.map((anak, i) => (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <div>
                            <label className={fieldLabel}>Nama Anak ke-{i + 1}</label>
                            <input type="text" required placeholder="Nama lengkap anak"
                              value={anak.namaAnak} onChange={(e) => handleAnakChange(i, "namaAnak", e.target.value)}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className={fieldLabel}>Tempat Lahir</label>
                            <input type="text" required placeholder="Kota lahir"
                              value={anak.tempatLahirAnak} onChange={(e) => handleAnakChange(i, "tempatLahirAnak", e.target.value)}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className={fieldLabel}>Tanggal Lahir</label>
                            <input type="date" required
                              value={anak.tanggalLahirAnak} onChange={(e) => handleAnakChange(i, "tanggalLahirAnak", e.target.value)}
                              className={inputCls} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Aksi */}
              <div className="pt-2 flex items-center justify-between">
                <button type="button" onClick={() => setActiveSubTab("pribadi")}
                  className="text-[11px] text-[#740223] font-bold uppercase tracking-wider hover:underline cursor-pointer">
                  ← Kembali ke Data Pribadi
                </button>
                <button type="submit" disabled={loading}
                  className="bg-[#740223] hover:bg-[#5a011a] text-white font-bold text-[11px] uppercase tracking-wider px-7 py-3 rounded-xl shadow-[0_4px_16px_rgba(116,2,35,0.15)] flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                  ) : (
                    <><Save className="w-4 h-4 text-[#c5a85c]" /><span>Simpan Biodata</span></>
                  )}
                </button>
              </div>
            </div>
          )}

        </Card>
      </form>
    </div>
  );
}