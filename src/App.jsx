import React, { useState, useEffect } from "react";
import ChessBoard from "./ChessBoard";
import Auth from "./components/Auth";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className="app-header">
          <h1 className="app-title">Cờ Vua</h1>
          <Auth user={user} />
        </div>

        <div className="game-section">
          <ChessBoard />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
