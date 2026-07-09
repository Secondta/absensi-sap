// src/context/AuthContext.jsx
//
// "Context" adalah cara React untuk berbagi data ke semua komponen
// tanpa harus kirim data satu per satu secara manual (prop drilling).
//
// AuthContext ini berfungsi sebagai "pusat informasi login":
// - Siapa yang sedang login?
// - Apa data profilnya? (nama, jabatan, NIK, dll)
// - Apakah sedang dalam proses pengecekan? (loading)

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// 1. Buat "wadah" context-nya
const AuthContext = createContext();

// 2. Buat "penyedia" (Provider) yang membungkus seluruh aplikasi
//    Semua komponen di dalam Provider ini bisa mengakses data auth
export function AuthProvider({ children }) {
  // `currentUser` = data user dari Firebase Auth (email, uid, dll)
  const [currentUser, setCurrentUser] = useState(null);

  // `userProfile` = data tambahan dari Firestore (nama, NIK, jabatan, dll)
  const [userProfile, setUserProfile] = useState(null);

  // `loading` = true saat sedang mengecek status login (saat pertama buka app)
  //             Penting agar halaman tidak "kedip" sebelum status diketahui
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `onAuthStateChanged` adalah "pendengar" dari Firebase.
    // Dia akan otomatis dipanggil setiap kali status login berubah:
    // - Saat user baru login → `user` berisi data user
    // - Saat user logout → `user` bernilai null
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Jika user sedang login, ambil data profilnya dari Firestore
        // Data disimpan di koleksi "users" dengan dokumen ID = uid user
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Gagal mengambil profil user:", error);
        }
      } else {
        // Jika tidak ada user (sudah logout), kosongkan profil
        setUserProfile(null);
      }

      // Setelah pengecekan selesai, matikan loading
      setLoading(false);
    });

    // Cleanup: hentikan "pendengar" saat komponen dihapus dari layar
    return unsubscribe;
  }, []);

  // Fungsi logout yang bisa dipanggil dari mana saja
  const logout = () => signOut(auth);

  // Nilai-nilai yang akan dibagikan ke seluruh aplikasi
  const value = {
    currentUser,   // Data auth Firebase (uid, email, dll)
    userProfile,   // Data profil dari Firestore (nama, jabatan, NIK, dll)
    setUserProfile, // Untuk update profil secara lokal tanpa reload
    loading,       // Status loading
    logout,        // Fungsi logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Tampilkan children hanya setelah pengecekan login selesai */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Buat custom hook agar mudah dipakai di komponen lain
//    Cukup tulis: const { currentUser, userProfile } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}