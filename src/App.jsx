import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import LocalGame from "./components/LocalGame";
import AIGameSetup from "./components/AIGameSetup";
import ChessBoard from "./ChessBoard.jsx";
import OnlineGameMenu from "./components/OnlineGameMenu";
import OnlineGameRoom from "./components/OnlineGameRoom";
import RequireAuth from "./components/RequireAuth";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Sidebar from "./Sidebar";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import LocalGameSetup from "./components/LocalGameSetup.jsx";

function GameModes({ theme }) {
  const navigate = useNavigate();
  const images = {
    light: {
      local: 'src/assets/icons8-cross-swords-66.png',
      pve: 'src/assets/icons8-robot-50.png',
      pvp: 'src/assets/icons8-globe-50.png',
    },
    dark: {
      local: 'src/assets/icons8-cross-swords-66.png',
      pve: 'src/assets/icons8-robot-50.png',
      pvp: 'src/assets/icons8-globe-50.png',
    },
  };
  return (
    <div className="game-modes">

      <h2>Chọn chế độ chơi</h2>
      <button
        className="mode-button"
        onClick={() => navigate('/local')}
      >
        <img src={images[theme].local} className="local-img"></img>
        Chơi 2 người 1 máy
      </button>
      <button
        className="mode-button"
        onClick={() => navigate('/ai')}
      >
        <img src={images[theme].pve} className="pve-img"></img>
        Chơi với máy
      </button>
      <button
        className="mode-button"
        onClick={() => navigate('/online')}
      >
        <img src={images[theme].pvp} className="pvp-img"></img>
        Chơi PvP Online
      </button>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <div className="app-container">
        <div className="app-header align-items-center">
          <Link to="/">
            <div className="brand align-items-center d-flex">
              <img className="app-icon" src="/chess.png" alt="Logo" />
              <h1 className="app-title text-body">Cờ vua</h1>
            </div>
          </Link>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
        </div>

        <div className="main-content">
          <div className="game-section">
            <Routes>
              <Route path="/" element={<GameModes theme={theme} />} />
              <Route path="/local" element={<LocalGameSetup theme={theme} />} />
              <Route path="/play-local" element={<LocalGame mode="local" theme={theme} />} />
              <Route path="/ai" element={<AIGameSetup />} />
              <Route path="/play-ai" element={<ChessBoard mode="ai" theme={theme} />} />
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

        <Sidebar
          theme={theme}
          toggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>
  );
}

export default App;