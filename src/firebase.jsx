import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  confirmPasswordReset
} from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; 

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZMt_JcnVYeoOyp6lhM210HtNEnYhYLNQ",
  authDomain: "chess-e60ba.firebaseapp.com",
  projectId: "chess-e60ba",
  storageBucket: "chess-e60ba.appspot.com",
  messagingSenderId: "782177440364",
  appId: "1:782177440364:web:2f1b7234223a415eff3e49",
  measurementId: "G-WNXYTC2WPK",
  databaseURL: "https://chess-e60ba-default-rtdb.firebaseio.com/"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// Tạo provider cho Google Authentication
const google = new GoogleAuthProvider();
const facebook = new FacebookAuthProvider();
const github = new GithubAuthProvider();

async function loginWithProvider(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Login thành công:", result.user);
    return result.user;
  } catch (error) {
    console.error("Lỗi login:", error);
  }
}

// Thêm các hàm authentication mới
async function registerWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    throw error;
  }
}

async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    throw error;
  }
}

async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Lỗi gửi email đặt lại mật khẩu:", error);
    throw error;
  }
}

async function confirmReset(code, newPassword) {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return true;
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    throw error;
  }
}

export { 
  auth, 
  db, 
  google, 
  facebook, 
  github, 
  loginWithProvider,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  confirmReset
};
