import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return <div className="loading-message">Đang kiểm tra đăng nhập...</div>;
  }

  if (!user) {
    return (
      <div className="auth-required">
        <h2>Yêu cầu đăng nhập</h2>
        <p>Bạn cần đăng nhập để sử dụng chế độ chơi online.</p>
        <div className="auth-buttons">
          <button onClick={() => navigate('/')}>
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;  