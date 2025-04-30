import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameExitHandler from './GameExitHandler';
import { safeNavigate } from '../utils/navigation';

const AIGame = () => {
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [game, setGame] = useState(null); // Assuming game state is managed here
  const navigate = useNavigate();
  
  // Determine if the game is active (for exit confirmation)
  const isGameActive = !showGameOverModal && game && !game.isGameOver();

  // Handle exit confirmation
  const handleExitConfirm = useCallback(() => {
    // In AI game, we just need to mark the game as over
    setShowGameOverModal(true);
    setGameOverMessage('Bạn đã thoát khỏi trò chơi. Trò chơi kết thúc!');
    setIsPaused(true);
  }, []);

  // Use safeNavigate instead of navigate directly
  const handleExitToHome = () => {
    safeNavigate('/');
  };

  return (
    <div className="chess-container">
      {/* Add the GameExitHandler component */}
      <GameExitHandler 
        isGameActive={isGameActive}
        gameMode="ai"
        onExitConfirm={handleExitConfirm}
      />
      
      {/* Existing game UI and logic */}
      {showGameOverModal && (
        <div className="game-over-modal">
          <p>{gameOverMessage}</p>
          <button onClick={handleExitToHome}>Quay về trang chủ</button>
        </div>
      )}
    </div>
  );
};

export default AIGame;