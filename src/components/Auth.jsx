import React from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, google, facebook, github } from "../firebase";
import "../App.css";

const Auth = ({ user }) => {
  const handleSignIn = async () => {
    try {
      // Using just one provider at a time - Google as default
      await signInWithPopup(auth, google);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  // If no user, don't show anything - this is handled by the Login button in App.jsx
  if (!user) return null;
  
  return (
    <div className="auth-container">
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
    </div>
  );
}

export default Auth;