import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleAuthRedirectResult } from '../firebase';

function AuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);
  
  useEffect(() => {
    // Handle redirect result
    const checkRedirectResult = async () => {
      try {
        const user = await handleAuthRedirectResult();
        if (user) {
          // If we got a user from redirect, navigate to home
          navigate('/');
        }
      } catch (error) {
        console.error("Lỗi xử lý đăng nhập:", error);
        setAuthError(error.message);
      }
    };
    
    checkRedirectResult();
    
    // Also monitor auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in and on the login page, redirect them home
        if (location.pathname.includes('/login')) {
          navigate('/');
        }
      }
    });
    
    return () => unsubscribe(); // Clean up the listener
  }, [navigate, location]);

  // This component doesn't render anything visible unless there's an error
  if (authError) {
    return <div className="auth-error" style={{padding: '10px', color: 'red'}}>{authError}</div>;
  }
  
  return null;
}

export default AuthHandler;
