import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useLocation, useNavigate } from 'react-router-dom';
import Timer from './components/Timer';
import MoveHistory from './components/MoveHistory';
import "./App.css";
import GameExitHandler from './components/GameExitHandler';
import PauseHandler from './components/PauseHandler';

const settingImages = {
  light: 'src/assets/pause-dark.png',
  dark: 'src/assets/pause-light.png'
}

const AIGame = ({ mode, theme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const gameRef = useRef(game); // Ref to hold the current game instance
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [engine, setEngine] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const gameSettings = mode === 'ai' ? location?.state : {};
  const playerColor = gameSettings?.playerColor || 'white';
  const difficulty = gameSettings?.difficulty || 'normal';
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });
  const [whiteTime, setWhiteTime] = useState(600); // Default 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [currentMoveTime, setCurrentMoveTime] = useState(30); // Default 30 seconds per move
  const isAIMoving = useRef(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const lastMove = useRef(null);
  const initialSetupComplete = useRef(false);
  const [isGameActive, setIsGameActive] = useState(true);
  const [isResuming, setIsResuming] = useState(false);
  

  const handleExitConfirm = () => {
    console.log("Exiting game...");
    navigate('/');
  };

  // Keep the gameRef updated with the latest game state
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const makeRandomMove = () => {
    try {
      const gameCopy = new Chess(gameRef.current.fen());
      console.debug("Making random move for", gameCopy.turn() === 'w' ? "white" : "black");
      const possibleMoves = gameCopy.moves({ verbose: true });
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const result = gameCopy.move({ from: randomMove.from, to: randomMove.to, promotion: 'q' });
        if (result) {
          console.log("Applied random AI move:", result);
          setGame(gameCopy);
          setMoveHistory(prev => [...prev, result]);
          if (timerSettings.isEnabled && timerSettings.timerType === 'perMove') {
            setCurrentMoveTime(timerSettings.perMoveTime);
          }
        } else {
          console.error("Failed to apply random move:", randomMove);
        }
      } else {
        console.log("No legal moves available - game may be over (in makeRandomMove)");
      }
    } catch (error) {
      console.error("Error making random move:", error);
    }
  };

  // Initialize timer settings from location state
  useEffect(() => {
    if (mode === 'ai' && location?.state?.timerSettings) {
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

  useEffect(() => {
    if (mode === 'ai') {
      if (!location.state) {
        console.warn("AI mode started without settings, redirecting to setup.");
        navigate('/ai');
        return;
      }

      try {
        console.log("Initializing Stockfish worker...");
        const stockfish = new Worker('/stockfish.js');

        stockfish.onmessage = (e) => {
          if (!e || !e.data) {
            console.error("Received empty message from stockfish worker");
            return;
          }

          const message = e.data;
          console.log("Stockfish message:", message);

          if (message === 'uciok') {
            console.log("Stockfish UCI OK");
            // Set skill level based on difficulty
            let skillLevel = 10; // Normal
            if (difficulty === 'easy') skillLevel = 5;
            if (difficulty === 'hard') skillLevel = 20;
            stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);
            stockfish.postMessage('isready');
          }
          else if (message === 'readyok') {
            console.log("Stockfish Ready OK");
            // Only do initial setup once
            if (!initialSetupComplete.current && playerColor === 'black' && gameRef.current.turn() === 'w') {
              console.log("AI will make first move as white");
              initialSetupComplete.current = true;
              setTimeout(() => {
                stockfish.postMessage('position fen ' + gameRef.current.fen());
                stockfish.postMessage('go movetime 1000');
              }, 500);
            }
          }
          else if (typeof message === 'string' && message.startsWith('bestmove')) {
            // Process AI move
            const moveStr = message.split(' ')[1];

            if (!moveStr || moveStr === '(none)') {
              console.warn("AI returned invalid move (none)");
              makeRandomMove();
              isAIMoving.current = false;
              return;
            }

            console.log("AI suggests move:", moveStr);
            // Log the turn to verify FEN sync
            console.debug("Current turn (before AI move):", gameRef.current.turn());

            try {
              // Apply the move
              const from = moveStr.substring(0, 2);
              const to = moveStr.substring(2, 4);
              const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : undefined;

              lastMove.current = { from, to };

              // Use the CURRENT game state VIA THE REF
              const gameCopy = new Chess(gameRef.current.fen());
              console.debug("Applying move to FEN:", gameRef.current.fen());

              // Try to directly apply the move using chess.js
              try {
                const moveResult = gameCopy.move({
                  from: from,
                  to: to,
                  promotion: promotion || 'q'
                });

                if (moveResult) {
                  console.log("Successfully applied AI move:", moveResult);
                  setGame(gameCopy);
                  setMoveHistory(prev => [...prev, moveResult]);

                  if (timerSettings.isEnabled && timerSettings.timerType === 'perMove') {
                    setCurrentMoveTime(timerSettings.perMoveTime);
                  }
                } else {
                  console.error("Failed to apply AI move (chess.js validation failed):", moveStr);
                  makeRandomMove();
                }
              } catch (moveError) {
                console.error("Error applying AI move (chess.js exception):", moveError.message, "Move:", moveStr);
                makeRandomMove();
              }
            } catch (error) {
              console.error("Error processing AI move:", error);
              makeRandomMove();
            } finally {
              isAIMoving.current = false;
            }
          }
          else if (message === 'Worker initialized') {
            console.log("Stockfish worker initialized, sending UCI command");
            stockfish.postMessage('uci');
          }
        };

        stockfish.onerror = (error) => {
          console.error("Stockfish worker error:", error);
          isAIMoving.current = false;
        };

        setEngine(stockfish);

        return () => {
          console.log("Cleaning up Stockfish worker");
          if (stockfish) {
            stockfish.terminate();
          }
          setEngine(null);
        };
      } catch (error) {
        console.error("Error setting up Stockfish worker:", error);
      }
    }
  }, [mode, navigate, playerColor, difficulty, location.state]);

  const requestAIMove = (currentGame) => {
    if (!engine || isAIMoving.current) {
      console.log("AI move request skipped: Engine not ready or AI already moving.");
      return;
    }

    try {
      const fen = currentGame.fen();
      console.log("Requesting AI move for position:", fen);
      isAIMoving.current = true;

      // Determine move time based on difficulty
      let moveTime = 1000;
      if (difficulty === 'easy') moveTime = 500;
      if (difficulty === 'hard') moveTime = 1500;

      engine.postMessage('position fen ' + fen);
      engine.postMessage('go movetime ' + moveTime);
    } catch (error) {
      console.error("Error requesting AI move:", error);
      isAIMoving.current = false;
    }
  };

  const handleTimeUp = () => {
    if (!isPaused && !showGameOverModal) {
      setGameOverMessage(`Hết thời gian! Bạn đã thua!`);
      setShowGameOverModal(true);
    }
  };

  const handleMoveComplete = () => {
    if (timerSettings.timerType === 'perMove') {
      setCurrentMoveTime(timerSettings.perMoveTime);
    }
  };

  const handlePauseGame = () => {
    setShowSettings(true);
    setIsPaused(true);
    setIsResuming(false);
  };
  const handleResumeGame = () => {
    setShowSettings(false);
    setIsResuming(true);
    setIsPaused(false);
    // Reset the flag after a short delay to ensure it's used in the render cycle
    setTimeout(() => setIsResuming(false), 100);
  };

  const handleNewGame = () => {
    navigate('/ai');
  };

  const handleExitToHome = () => {
    navigate('/');
  };

  const handleSquareClick = (square) => {
    if (isPaused || game.isGameOver() || showGameOverModal || isAIMoving.current) {
      console.log("Square click ignored: Paused, game over, modal shown, or AI moving.");
      return;
    }

    const currentTurn = game.turn();
    const playerSide = playerColor === 'white' ? 'w' : 'b';

    if (mode === 'ai' && currentTurn !== playerSide) {
      console.log("Not your turn, waiting for AI move");
      return;
    }

    if (selectedSquare === null) {
      const piece = game.get(square);
      if (piece && piece.color === playerSide) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    } else {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      try {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });

        if (move) {
          console.log("Player made move:", move);
          lastMove.current = { from: selectedSquare, to: square };

          setGame(gameCopy);
          setMoveHistory(prev => [...prev, move]);
          setSelectedSquare(null);

          if (gameCopy.isGameOver()) {
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
          } else if (mode === 'ai' && engine) {
            console.log("Scheduling AI response");
            setTimeout(() => {
              requestAIMove(gameCopy);
            }, 300);
          }
        } else {
          setSelectedSquare(null);
        }
      } catch (error) {
        console.warn('Invalid move attempted:', error.message);
        setSelectedSquare(null);
      }
    }
  };

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
      <GameExitHandler
        isGameActive={isGameActive}
        gameMode="ai"
        onExitConfirm={handleExitConfirm}
        gameEnded={showGameOverModal} 
      />

      <div className="game-info position-relative align-items-center text-center py-2 rounded">
        <div className="fw-bold fs-4">
          Bạn ({playerColor === 'white' ? 'Trắng ⚪' : 'Đen ⚫'}) vs Máy ({playerColor === 'white' ? 'Đen ⚫' : 'Trắng ⚪'}) <br/>
          Độ khó: {difficulty}
        </div>
        <div>Lượt của: {game.turn() === playerColor ? 'Bạn' : 'Máy'}</div>
          <PauseHandler 
            isPaused={isPaused}
            theme={theme}
            onPause={handlePauseGame}
            onResume={handleResumeGame}
            onExit={handleExitToHome}
            settingImages={settingImages}
          />
      </div>

      {showGameOverModal && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>Game Over</h2>
            <p>{gameOverMessage}</p>
            <div className="game-over-buttons">
              <button className="control-button new-game" onClick={handleNewGame}>
                Ván mới
              </button>
              <button className="control-button exit" onClick={handleExitToHome}>
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {timerSettings.isEnabled && (
        <div className="timers">
          <div className="white-timer">
            <div>{playerColor === 'w' ? 'Bạn: ' : 'Máy: ' }Trắng ⚪</div>
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
            <div>{playerColor === 'b' ? 'Bạn: ' : 'Máy: '}Đen ⚫</div>
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
            boardOrientation={playerColor === 'black' ? 'black' : 'white'}
            customSquareStyles={customSquareStyles}
            areArrowsAllowed={false}
            isDraggablePiece={() => false}
            boardWidth={480}
          />
        </div>

        <MoveHistory
          moves={moveHistory}
          boardOrientation={playerColor}
        />
      </div>
    </div>
  );
};

export default AIGame;