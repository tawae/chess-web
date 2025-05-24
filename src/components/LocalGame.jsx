import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import TimerSettings from './TimerSettings';
import Timer from './Timer';
import MoveHistory from './MoveHistory';
import { useNavigate } from 'react-router-dom';
import GameExitHandler from './GameExitHandler';
import { safeNavigate } from '../utils/navigation';

const settingImages = {
  light: 'src/assets/icons8-setting-50.png',
  dark: 'src/assets/icons8-white-setting-50.png'
}

const LocalGame = ({ theme }) => {
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });
  const [whiteTime, setWhiteTime] = useState(timerSettings.totalTime * 60);
  const [blackTime, setBlackTime] = useState(timerSettings.totalTime * 60);
  const [currentMoveTime, setCurrentMoveTime] = useState(timerSettings.perMoveTime);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');

  // Determine if the game is active (for exit confirmation)
  const isGameActive = !showGameOverModal && game && !game.isGameOver();

  // Handle exit confirmation
  const handleExitConfirm = useCallback(() => {
    // In local game, we just need to mark the game as over
    setShowGameOverModal(true);
    setGameOverMessage('Bạn đã thoát khỏi trò chơi. Trò chơi kết thúc!');
    setIsPaused(true);
  }, []);

  // Handle timer settings changes
  const handleTimerSettingsChange = (newSettings) => {
    setTimerSettings(newSettings);
    if (newSettings.isEnabled) {
      if (newSettings.timerType === 'total') {
        setWhiteTime(parseFloat(newSettings.totalTime) * 60);
        setBlackTime(parseFloat(newSettings.totalTime) * 60);
      } else {
        setCurrentMoveTime(parseFloat(newSettings.perMoveTime));
      }
    }
  };

  const restartGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setMoveHistory([]);
    setShowGameOverModal(false);
    // Reset timers if they're enabled
    if (timerSettings.isEnabled) {
      setWhiteTime(timerSettings.totalTime * 60);
      setBlackTime(timerSettings.totalTime * 60);
      setCurrentMoveTime(timerSettings.perMoveTime);
    }
  };

  const handleSquareClick = (square) => {
    if (isPaused || game.isGameOver() || showGameOverModal) return;

    if (selectedSquare === null) {
      // Chỉ cho phép chọn ô có quân cờ
      const piece = game.get(square);
      if (piece) {
        setSelectedSquare(square);
      }
    } else {
      // Nếu click vào cùng một ô, bỏ chọn
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      // Thử thực hiện nước đi
      const gameCopy = new Chess(game.fen());
      try {
        const move = gameCopy.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });

        if (move) {
          setGame(gameCopy);
          setMoveHistory(prev => [...prev, move]);
          if (timerSettings.isEnabled && timerSettings.timerType === 'perMove') {
            setCurrentMoveTime(timerSettings.perMoveTime);
          }

          if (gameCopy.isGameOver()) {
            if (gameCopy.isCheckmate()) {
              setGameOverMessage(`Chiếu hết! ${gameCopy.turn() === 'w' ? 'Đen' : 'Trắng'} thắng!`);
            } else if (gameCopy.isDraw()) {
              setGameOverMessage('Hòa!');
            } else {
              setGameOverMessage('Game kết thúc!');
            }
            setShowGameOverModal(true)
            isPaused(true);
          }
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }
      setSelectedSquare(null);
    }
  };

  const handleTimeUp = () => {
    if (!isPaused && !showGameOverModal) {
      const currentTurn = game.turn();
      const winner = currentTurn === 'w' ? 'Đen' : 'Trắng';

      // Mark the game as over without trying to set an invalid FEN
      const gameCopy = new Chess(game.fen());
      // Instead of trying to load an invalid FEN, we'll just set a flag
      setGame(gameCopy);

      // Show game over modal
      setGameOverMessage(`Hết thời gian! ${winner} thắng!`);
      setShowGameOverModal(true);
    }
  };

  const handleMoveComplete = () => {
    if (timerSettings.timerType === 'perMove') {
      setCurrentMoveTime(timerSettings.perMoveTime);
    }
  };

  const handleExitToHome = () => {
    // Since the game is already over when this function is called,
    // we can navigate directly without confirmation
    safeNavigate('/');
  };

  // Tạo custom styles cho các ô được chọn
  const customSquareStyles = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    const moves = game.moves({ square: selectedSquare, verbose: true });
    moves.forEach(move => {
      customSquareStyles[move.to] = { backgroundColor: "rgba(0, 255, 0, 0.2)" };
    });
  }

  return (
    <div className="chess-container">
      {/* Add the GameExitHandler component */}
      <GameExitHandler
        isGameActive={isGameActive}
        gameMode="local"
        onExitConfirm={handleExitConfirm}
      />

      <button
        className="settings-button"
        onClick={() => {
          setShowSettings(!showSettings);
          setIsPaused(!isPaused);
        }}
      >
        {/* ⚙️ */}
        <img src={settingImages[theme]}></img>
      </button>

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-content">
            <h2>Cài đặt</h2>
            <TimerSettings onSettingsChange={handleTimerSettingsChange} />
            <button
              className="control-button resume"
              onClick={() => {
                setShowSettings(false);
                setIsPaused(false);
              }}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {showGameOverModal && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>Game Over</h2>
            <p>{gameOverMessage}</p>
            <div className="game-over-buttons">
              <button className="control-button new-game" onClick={restartGame}>
                Ván mới
              </button>
              <button className="control-button exit" onClick={handleExitToHome}>
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-info">
        <div>Lượt đi: {game.turn() === 'w' ? 'Trắng' : 'Đen'}</div>
      </div>

      {timerSettings.isEnabled && (
        <div className="timers">
          <div className="white-timer">
            <div>Trắng ⚪</div>
            <Timer
              initialTime={timerSettings.timerType === 'total' ? whiteTime : currentMoveTime}
              isActive={!isPaused && !showGameOverModal && game.turn() === 'w'}
              onTimeUp={handleTimeUp}
              timerType={timerSettings.timerType}
              onMoveComplete={handleMoveComplete}
            />
          </div>
          <div className="black-timer">
            <div>Đen ⚫</div>
            <Timer
              initialTime={timerSettings.timerType === 'total' ? blackTime : currentMoveTime}
              isActive={!isPaused && !showGameOverModal && game.turn() === 'b'}
              onTimeUp={handleTimeUp}
              timerType={timerSettings.timerType}
              onMoveComplete={handleMoveComplete}
            />
          </div>
        </div>
      )}

      <div className="board-container">
        <div className="board-wrapper">
          <Chessboard
            position={game.fen()}
            onSquareClick={handleSquareClick}
            customSquareStyles={customSquareStyles}
            areArrowsAllowed={false}
            isDraggablePiece={() => false}
            boardWidth={480}
          />
        </div>

        <MoveHistory moves={moveHistory} />
      </div>
    </div>
  );
};

export default LocalGame;
