import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Timer from './Timer';
import MoveHistory from './MoveHistory';
import { useLocation, useNavigate } from 'react-router-dom';
import GameExitHandler from './GameExitHandler';
import { safeNavigate } from '../utils/navigation';
import PauseHandler from './PauseHandler';
import GameOverModal from './GameOverModal';


const settingImages = {
  light: 'src/assets/pause-dark.png',
  dark: 'src/assets/pause-light.png'
}

const LocalGame = ({ mode, theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const gameSettings = mode === 'local' ? location?.state : {};
  const [whiteTime, setWhiteTime] = useState(timerSettings.totalTime * 60);
  const [blackTime, setBlackTime] = useState(timerSettings.totalTime * 60);
  const [currentMoveTime, setCurrentMoveTime] = useState(timerSettings.perMoveTime);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [isResuming, setIsResuming] = useState(false);

  // Determine if the game is active (for exit confirmation)
  const isGameActive = !showGameOverModal && game && !game.isGameOver();

  // Handle exit confirmation
  const handleExitConfirm = useCallback(() => {
    setShowGameOverModal(true);
    setGameOverMessage('Bạn đã thoát khỏi trò chơi. Trò chơi kết thúc!');
    setIsPaused(true);
  }, []);

  // Initialize timer settings from location state
  useEffect(() => {
    if (mode === 'local' && location?.state?.timerSettings) {
      const settings = location.state.timerSettings;
      setTimerSettings(settings);

      if (settings.isEnabled) {
        if (settings.timerType === 'total') {
          // Convert minutes to seconds for the timer
          setWhiteTime(parseFloat(settings.totalTime) * 60);
          setBlackTime(parseFloat(settings.totalTime) * 60);
        } else {
          setCurrentMoveTime(parseFloat(settings.perMoveTime));
        }
      }
    }
  }, [mode, location?.state]);

  const restartGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setMoveHistory([]);
    setShowGameOverModal(false);
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
          promotion: 'q',
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

      const gameCopy = new Chess(game.fen());
      setGame(gameCopy);

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
    safeNavigate('/');
  };

  const customSquareStyles = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    const moves = game.moves({ square: selectedSquare, verbose: true });
    moves.forEach(move => {
      customSquareStyles[move.to] = { backgroundColor: "rgba(0, 255, 0, 0.2)" };
    });
  }

  const handleResumeGame = () => {
    setShowSettings(false);
    setIsResuming(true);
    setIsPaused(false);
    // Reset the flag after a short delay to ensure it's used in the render cycle
    setTimeout(() => setIsResuming(false), 100);
  };

  const handlePauseGame = () => {
    setShowSettings(true);
    setIsPaused(true);
    setIsResuming(false);
  };

  return (
    <div className="chess-container">
      <GameExitHandler
        isGameActive={isGameActive}
        gameMode="local"
        onExitConfirm={handleExitConfirm}
      />

      <GameOverModal 
        show={showGameOverModal}
        message={gameOverMessage}
        onNewGame={restartGame}
        onExit={handleExitToHome}
      />

      <div className="game-info position-relative align-items-center text-center py-2 rounded">
        <div className="fw-bold fs-4">
          Lượt đi: {game.turn() === 'w' ? 'Trắng' : 'Đen'}
        </div>
          <PauseHandler 
            isPaused={isPaused}
            theme={theme}
            onPause={handlePauseGame}
            onResume={handleResumeGame}
            onExit={handleExitToHome}
            settingImages={settingImages}
          />
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
              isPauseResume={isResuming}
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
              isPauseResume={isResuming}
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
