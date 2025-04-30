import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";
import LocalGame from "./components/LocalGame";
import AIGameSetup from "./components/AIGameSetup";
import ChessBoard from "./ChessBoard.jsx";
import OnlineGameMenu from "./components/OnlineGameMenu";
import OnlineGameRoom from "./components/OnlineGameRoom";
import RequireAuth from "./components/RequireAuth";
import Auth from "./components/Auth";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useAuth } from "./hooks/useAuth";

// Component cho trang chủ
function GameModes() {
  const navigate = useNavigate();
  
  return (
    <div className="game-modes">
      <h2>Chọn chế độ chơi</h2>
      <button 
        className="mode-button"
        onClick={() => navigate('/local')}
      >
        Chơi 2 người 1 máy
      </button>
      <button 
        className="mode-button"
        onClick={() => navigate('/ai')}
      >
        Chơi với máy
      </button>
      <button 
        className="mode-button"
        onClick={() => navigate('/online')}
      >
        Chơi PvP Online
      </button>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Add this to get current location
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="align-items-center d-flex flex-column">
        <div className="app-header align-items-center">
          <Link to="/">
            <div className="brand align-items-center d-flex">
              <img className="app-icon" src="/chess.png" alt="Logo" />
              <h1 className="app-title text-body">Cờ Vua</h1>
            </div>
          </Link>

          <button className="btn-lg btn btn-outline-primary" onClick={toggleTheme}>
              {theme === "light" ? "🌙 Dark" : "🌞 Light"}
          </button>

          {!user && location.pathname !== '/login' && location.pathname !== '/forgot-password' && (
            <button 
              className="btn-lg btn auth-button" 
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </button>
          )}
          <Auth user={user} />
        </div>

        <div className="game-section">
            <Routes>
              <Route path="/" element={<GameModes />} />
              <Route path="/local" element={<LocalGame />} />
              <Route path="/ai" element={<AIGameSetup />} />
              <Route path="/play-ai" element={<ChessBoard mode="ai" />} />
              <Route 
                path="/online" 
                element={
                  <RequireAuth>
                    <OnlineGameMenu />
                  </RequireAuth>
                } 
              />
              <Route 
                path="/online/room/:roomId" 
                element={
                  <RequireAuth>
                    <OnlineGameRoom />
                  </RequireAuth>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
