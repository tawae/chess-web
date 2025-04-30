import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth, loginWithEmail, registerWithEmail } from "../firebase"; 
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Social login handlers
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (error) {
      setError(error.message);
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, new FacebookAuthProvider());
      navigate('/');
    } catch (error) {
      setError(error.message);
      console.error("Facebook login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, new GithubAuthProvider());
      navigate('/');
    } catch (error) {
      setError(error.message);
      console.error("GitHub login error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Email authentication handlers
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      navigate('/');
    } catch (error) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      console.error("Email login error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    try {
      setLoading(true);
      await registerWithEmail(email, password);
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email đã được sử dụng');
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button 
          className={`toggle-btn ${isLoginView ? 'active' : ''}`}
          onClick={() => setIsLoginView(true)}
        >
          Đăng nhập
        </button>
        <button 
          className={`toggle-btn ${!isLoginView ? 'active' : ''}`}
          onClick={() => setIsLoginView(false)}
        >
          Đăng ký
        </button>
      </div>
      
      {error && <div className="auth-error">{error}</div>}
      
      {isLoginView ? (
        // LOGIN FORM
        <div className="auth-form">
          <form onSubmit={handleEmailLogin}>
            <div className="form-group align-items-center">
              <label className='col-sm-4'>Email</label>
              <input 
                type="email" 
                className='col-sm-8'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            </div>
            <div className="form-group align-items-center">
              <label className='col-sm-4'>Mật khẩu</label>
              <input 
                type="password" 
                className='col-sm-8'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
          
          <div className="divider">
            <span>hoặc đăng nhập với</span>
          </div>
          
          <div className="social-logins">
            <button className="login-button" onClick={handleGoogleLogin} disabled={loading}>
              <span>
                <img className="social-logo" src="/gg-icon.png" alt="Google" />
              </span>
              <span className='social-text'>Google</span>
            </button>
            <button className="login-button" onClick={handleFacebookLogin} disabled={loading}>
              <span>
                <img className="social-logo" src="/fb-icon.png" alt="Facebook" />
              </span>
              <span className='social-text'>Facebook</span>
            </button>
            <button className="login-button" onClick={handleGitHubLogin} disabled={loading}>
              <span>
                <img className="social-logo" src="/github-icon.png" alt="GitHub" />
              </span>
              <span className='social-text'>GitHub</span>
            </button>
          </div>
          
          <div className="auth-footer">
            <Link to="/forgot-password" className="forgot-password-link">
              Quên mật khẩu?
            </Link>
          </div>
        </div>
      ) : (
        // REGISTRATION FORM
        <div className="auth-form">
          <form onSubmit={handleRegister}>
            <div className="form-group align-items-center d-flex">
              <label className='col-sm-4'>Email</label>
              <input 
                className='col-sm-8'
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            </div>
            <div className="form-group align-items-center d-flex">
              <label className='col-sm-4'>Mật khẩu</label>
              <input 
                className='col-sm-8'
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                required
              />
            </div>
            <div className="form-group align-items-center d-flex">
              <label className='col-sm-4'>Xác nhận mật khẩu</label>
              <input 
                type="password" className='col-sm-8'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
