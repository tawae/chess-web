import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../firebase';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    
    try {
      setLoading(true);
      await resetPassword(email);
      setResetSent(true);
      setCountdown(30);
      setSuccess(true);
      setError('');
    } catch (error) {
      setError('Không thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra lại email.');
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    try {
      setLoading(true);
      await resetPassword(email);
      setCountdown(30);
      setSuccess(true);
      setError('');
    } catch (error) {
      setError('Không thể gửi lại email. Vui lòng thử lại sau.');
      console.error("Resend code error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Khôi phục mật khẩu</h2>
      
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">
        Email khôi phục đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
      </div>}
      
      <form onSubmit={handleResetPassword}>
        <div className="form-group align-items-center justify-content-center">
          <label>Email:</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading && !resetSent ? 'Đang xử lý...' : 'Gửi email khôi phục'}
        </button>
        
        {resetSent && (
          <div className="resend-section">
            <button 
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || loading}
              className="resend-btn"
            >
              {loading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
            </button>
          </div>
        )}
      </form>
      
      <div className="auth-footer">
        <button 
          onClick={() => navigate('/login')}
          className="back-to-login"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
