import React from 'react';

const GameOverModal = ({ 
  show, 
  message, 
  onNewGame, 
  onExit,
  additionalInfo = null
}) => {
  if (!show) return null;
  
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h2>Game Over</h2>
        <p>{message}</p>
        {additionalInfo && <p className="additional-info">{additionalInfo}</p>}
        <div className="game-over-buttons">
          {onNewGame && (
            <button className="control-button new-game" onClick={onNewGame}>
              Ván mới
            </button>
          )}
          <button className="control-button exit" onClick={onExit}>
            Thoát
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;