import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import './Sidebar.css';
import { auth } from "./firebase";

const Sidebar = ({ theme, toggleTheme, isSidebarOpen, setIsSidebarOpen }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <button className="sidebar-toggle" onClick={handleToggleSidebar}>
                    {isSidebarOpen ? '✖' : '☰'}
                </button>
                <h2 className="sidebar-title">Hệ thống</h2>
            </div>

            <div className="sidebar-footer">
                {user ? (
                    <div className="user-info">
                        <span>{user.displayName || user.email}</span>
                        <button
                            className="auth-button"
                            onClick={() => {
                                auth.signOut();
                                navigate('/');
                            }}
                        >
                            Đăng xuất
                        </button>
                    </div>
                ) : (
                    <button
                        className="auth-button"
                        onClick={() => {
                            navigate('/login');
                            handleToggleSidebar();
                        }}
                    >
                        Đăng nhập
                    </button>
                )}
                <button className="theme-button" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙 Dark mode' : '🌞 Light mode'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;