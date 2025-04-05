// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Thêm GoogleAuthProvider
import { getFirestore } from "firebase/firestore"; // Thêm Firestore
import { getAnalytics } from "firebase/analytics";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZMt_JcnVYeoOyp6lhM210HtNEnYhYLNQ",
  authDomain: "chess-e60ba.firebaseapp.com",
  projectId: "chess-e60ba",
  storageBucket: "chess-e60ba.appspot.com",
  messagingSenderId: "782177440364",
  appId: "1:782177440364:web:2f1b7234223a415eff3e49",
  measurementId: "G-WNXYTC2WPK"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Thêm auth
const db = getFirestore(app); // Thêm Firestore

// Tạo provider cho Google Authentication
const provider = new GoogleAuthProvider();

export { auth, db, provider }; // Xuất provider
