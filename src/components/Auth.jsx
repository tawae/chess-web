import React from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../firebase";
import "../App.css";

const Auth = ({ user }) => {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="auth-container">
      {user ? (
        <div className="user-info">
          <img
            src={user.photoURL}
            alt="avatar"
            style={{ width: "32px", borderRadius: "50%" }}
          />
          <span>{user.displayName}</span>
          <button className="auth-button" onClick={handleSignOut}>
            Đăng xuất
          </button>
        </div>
      ) : (
        <button className="auth-button" onClick={handleSignIn}>
          Đăng nhập với Google
        </button>
      )}
    </div>
  );
}

export default Auth; 