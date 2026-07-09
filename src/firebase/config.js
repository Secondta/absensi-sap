// src/firebase/config.js
//
// File ini adalah "jembatan" antara aplikasi React kita dengan Firebase.
// Kita menginisialisasi (menyalakan) layanan Firebase di sini sekali,
// lalu mengekspornya agar bisa dipakai di file lain.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️  GANTI dengan konfigurasi Firebase milikmu sendiri
// (Ambil dari Firebase Console → Project Settings → Your Apps)
const firebaseConfig = {
  apiKey: "AIzaSyBe4UdSnZ78pwOC2r4LBa1W39DwPiCOCFU",
  authDomain: "absensi-sap.firebaseapp.com",
  projectId: "absensi-sap",
  storageBucket: "absensi-sap.firebasestorage.app",
  messagingSenderId: "175393618491",
  appId: "1:175393618491:web:ce09d06be8ba41aa3bfa1e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan agar bisa dipakai di file lain
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // 3. Inisialisasi storage di sini

export { auth, db, storage };