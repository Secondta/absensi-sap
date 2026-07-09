// AbsenTab.jsx - (UI disesuaikan dengan style Admin)
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { Camera, MapPin, CheckCircle, AlertTriangle, Loader2, RefreshCw, LogIn, LogOut, Calendar, Clock } from "lucide-react";
import Swal from "sweetalert2";

// ── Shared design tokens (sama persis dengan Admin) ────────────
const Label = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

export default function AbsenTab({ time, isActive }) {
  const { userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const formatTime = (d) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) =>
    d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const videoRef = useRef(null);
  const [streamInstance, setStreamInstance] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraPermission, setCameraPermission] = useState("checking");

  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [locationAddress, setLocationAddress] = useState("Mendeteksi lokasi GPS Anda...");

  const [attendanceStatus, setAttendanceStatus] = useState("masuk");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkGpsLocation();
    checkExistingAttendance();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
  }, [isActive]);

  const checkExistingAttendance = async () => {
    if (!userProfile?.uid) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const snap = await getDoc(doc(db, "attendance", `${userProfile.uid}_${todayStr}`));
      if (snap.exists()) {
        const d = snap.data();
        if (d.absenMasuk && d.absenPulang) setAttendanceStatus("selesai");
        else if (d.absenMasuk) setAttendanceStatus("pulang");
        else setAttendanceStatus("masuk");
      } else setAttendanceStatus("masuk");
    } catch (err) { console.error(err); }
  };

  const checkGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationAddress("Perangkat Anda tidak mendukung GPS.");
      setIsWithinRange(true);
      return;
    }
    setLocationAddress("Mendeteksi lokasi GPS Anda...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsWithinRange(true);
        setLocationAddress("Lokasi berhasil dideteksi. Koordinat tercatat untuk absensi.");
      },
      (err) => {
        console.error("GPS Error:", err.code, err.message);
        setIsWithinRange(true);
        setLocationAddress("Sinyal GPS tidak terdeteksi. Absensi tetap dapat dilanjutkan.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setCameraPermission("checking");
    try {
      if (streamInstance) streamInstance.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      setStreamInstance(stream);
      setCameraPermission("granted");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");
          videoRef.current.play().catch((e) => console.error(e));
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setCameraPermission("denied");
      Swal.fire({ title: "Akses Kamera Gagal", text: "Pastikan izin kamera di browser sudah diizinkan.", icon: "error", confirmButtonColor: "#740223" });
    }
  };

  const stopCamera = () => { if (streamInstance) { streamInstance.getTracks().forEach((t) => t.stop()); setStreamInstance(null); } };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.75));
    stopCamera();
  };

  const resetPageStatus = () => { setCapturedImage(null); checkExistingAttendance(); startCamera(); };

  const handleExecuteAbsen = async () => {
    if (!capturedImage) return;
    setLoading(true);
    try {
      const todayStr = currentTime.toISOString().split("T")[0];
      const timeStr = currentTime.toLocaleTimeString("id-ID");
      const docRef = doc(db, "attendance", `${userProfile?.uid}_${todayStr}`);

      if (attendanceStatus === "masuk") {
        await setDoc(docRef, {
          uid: userProfile?.uid,
          namaLengkap: userProfile?.namaLengkap || "Karyawan SAP",
          tanggal: todayStr,
          absenMasuk: { waktu: timeStr, fotoUrl: capturedImage, koordinat: coords ?? null, akurasiGpsMeter: gpsAccuracy ?? null },
          absenPulang: null,
          dikirimPada: new Date().toISOString(),
        });
        Swal.fire({ title: "Absen Masuk Berhasil!", html: `Selamat Bekerja!<br>Waktu tercatat: <b>${timeStr}</b>`, icon: "success", timer: 3000, timerProgressBar: true, confirmButtonColor: "#740223" });
      } else if (attendanceStatus === "pulang") {
        await updateDoc(docRef, {
          absenPulang: { waktu: timeStr, fotoUrl: capturedImage, koordinat: coords ?? null, akurasiGpsMeter: gpsAccuracy ?? null },
          diperbaruiPada: new Date().toISOString(),
        });
        Swal.fire({ title: "Absen Pulang Berhasil!", html: `Hati-hati di jalan!<br>Waktu tercatat: <b>${timeStr}</b>`, icon: "success", timer: 3000, timerProgressBar: true, confirmButtonColor: "#740223" });
      }
      resetPageStatus();
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Gagal Mengirim Absensi", text: err.message, icon: "error", confirmButtonColor: "#740223" });
    } finally { setLoading(false); }
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
              <p className="text-sm font-bold text-slate-700">{formatDate(time ?? currentTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-[#c5a85c]" />
            <span className="text-xs font-bold text-slate-700">{formatTime(time ?? currentTime)} WIB</span>
          </div>
        </div>
      </Card>

      {/* Status Absen */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <Label>Agenda Absen Hari Ini</Label>
          {attendanceStatus === "masuk" && (
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
              <LogIn className="w-3.5 h-3.5" /> Absen Masuk
            </span>
          )}
          {attendanceStatus === "pulang" && (
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-wider">
              <LogOut className="w-3.5 h-3.5" /> Absen Pulang
            </span>
          )}
          {attendanceStatus === "selesai" && (
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5" /> Selesai Hari Ini
            </span>
          )}
        </div>
      </Card>

      {/* Kamera */}
      <Card className="p-5">
        <div className="flex items-center gap-1.5 mb-4">
          <Camera className="w-3.5 h-3.5 text-[#c5a85c]" />
          <Label>Kamera Verifikasi Wajah</Label>
        </div>

        <div className="w-full max-w-[240px] aspect-square rounded-2xl bg-slate-50 overflow-hidden relative shadow-inner border border-slate-200 flex flex-col items-center justify-center mx-auto">
          {cameraPermission === "granted" && !capturedImage && attendanceStatus !== "selesai" && (
            <video ref={videoRef} autoPlay playsInline muted webkit-playsinline="true" className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {capturedImage && (
            <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
          )}
          {attendanceStatus === "selesai" && (
            <div className="text-center p-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Absen Masuk &amp; Pulang Anda sudah lengkap.</p>
            </div>
          )}
          {cameraPermission === "checking" && attendanceStatus !== "selesai" && (
            <div className="flex flex-col items-center gap-2 p-3 text-center">
              <Loader2 className="w-6 h-6 text-[#740223] animate-spin" />
              <button type="button" onClick={startCamera} className="text-[10px] font-bold text-[#740223] bg-[#740223]/10 px-2.5 py-1 rounded-xl cursor-pointer mt-1">
                Klik jika kamera macet
              </button>
            </div>
          )}
        </div>

        {attendanceStatus !== "selesai" && (
          <div className="mt-4 text-center">
            {!capturedImage ? (
              <button type="button" disabled={cameraPermission !== "granted"} onClick={captureSnapshot}
                className="bg-[#740223] hover:bg-[#5a011a] text-white font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-40">
                Ambil Foto
              </button>
            ) : (
              <button type="button" onClick={resetPageStatus}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#740223] uppercase tracking-wider cursor-pointer mx-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
              </button>
            )}
          </div>
        )}
      </Card>

      {/* GPS */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#c5a85c]" />
            <Label>Lokasi GPS</Label>
          </div>
          {gpsAccuracy !== null && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
              ±{gpsAccuracy}m
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isWithinRange ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {isWithinRange ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Lokasi Absensi</p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{locationAddress}</p>
          </div>
        </div>

        <button type="button" onClick={checkGpsLocation}
          className="w-full mt-4 border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Segarkan Sinyal GPS
        </button>
      </Card>

      {/* Tombol Submit */}
      <button
        type="button"
        disabled={loading || !isWithinRange || !capturedImage || attendanceStatus === "selesai"}
        onClick={handleExecuteAbsen}
        className="w-full bg-[#740223] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(116,2,35,0.15)] disabled:shadow-none"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span>Kirim Absen {attendanceStatus === "pulang" ? "Pulang" : "Masuk"}</span>
        )}
      </button>
    </div>
  );
}