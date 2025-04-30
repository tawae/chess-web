import React from 'react';

const GameControls = ({ 
  isPaused, 
  onPause, 
  onResume, 
  onResign,
  onNewGame
}) => {
  return (
    <div className="game-controls">
      {!isPaused ? (
        <button 
          className="control-button pause"
          onClick={onPause}
        >
          Tạm dừng
        </button>
      ) : (
        <div className="pause-menu">
          <button 
            className="control-button resume"
            onClick={onResume}
          >
            Tiếp tục
          </button>
          <button 
            className="control-button resign"
            onClick={onResign}
          >
            Đầu hàng
          </button>
          <button 
            className="control-button new-game"
            onClick={onNewGame}
          >
            Ván mới
          </button>
        </div>
      )}
    </div>
  );
};

export default GameControls; 