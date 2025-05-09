import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { db } from '../firebase';
import { ref, onValue, set, off, remove, update } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import TimerSettings from './TimerSettings';
import Timer from './Timer';
import MoveHistory from './MoveHistory';
import GameExitHandler from './GameExitHandler';
import { safeNavigate } from '../utils/navigation';

const OnlineGameRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState('start');
  const [roomData, setRoomData] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600); // 10 minutes in seconds
  const [currentMoveTime, setCurrentMoveTime] = useState(30); // 30 seconds per move

  useEffect(() => {
    if (!user || !roomId) return;

    console.log("Setting up listener for room:", roomId);
    const roomRef = ref(db, `rooms/${roomId}`);

    const listener = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        alert('Phòng không tồn tại hoặc đã bị hủy.');
        safeNavigate('/online');
        return;
      }

      const data = snapshot.val();
      console.log("Received room data:", data);
      setRoomData(data);

      // Set timer settings from room data
      if (data.timerSettings) {
        setTimerSettings(data.timerSettings);
        if (data.timerSettings.isEnabled) {
          if (data.timerSettings.timerType === 'total') {
            setWhiteTime(data.whiteTime || data.timerSettings.totalTime * 60);
            setBlackTime(data.blackTime || data.timerSettings.totalTime * 60);
          } else {
            setCurrentMoveTime(data.currentMoveTime || data.timerSettings.perMoveTime);
          }
        }
      }

      if (user && data.players) {
        const playerData = data.players[user.uid];
        if (playerData) {
          setPlayerColor(playerData.color);
          console.log("Player color set to:", playerData.color);
        } else {
          console.warn("User not found in room players!");
        }
        const playerIds = Object.keys(data.players);
        const opponentId = playerIds.find(id => id !== user.uid);
        setOpponent(opponentId ? data.players[opponentId] : null);
      }

      const newGameInstance = new Chess();
      if (data.moves && Array.isArray(data.moves)) {
        console.log(`Processing ${data.moves.length} moves from DB...`);
        data.moves.forEach((move, index) => {
          try {
            if (move && typeof move === 'object' && move.from && move.to) {
              const result = newGameInstance.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
               if (!result) console.warn(`Move ${index+1} (${move.san || move.from + '-' + move.to}) failed to apply locally.`);
            } else {
               console.warn(`Invalid move format at index ${index}:`, move);
            }
          } catch (e) {
            console.error(`Error processing move ${index+1}:`, move, e);
          }
        });
      }
      gameRef.current = newGameInstance;
      const currentFen = newGameInstance.fen();
      setFen(currentFen);
      console.log("Board updated to FEN:", currentFen);

      // Check if it's the player's turn
      const turn = newGameInstance.turn() === 'w' ? 'white' : 'black';
      const playerTurn = data.players && user && data.players[user.uid]?.color === turn;
      setIsMyTurn(playerTurn && data.status === 'playing' && !newGameInstance.isGameOver());
      console.log(`Is my turn? ${playerTurn}, My color: ${data.players && user ? data.players[user.uid]?.color : 'unknown'}, Game turn: ${turn}`);
    });

    return () => {
      console.log("Removing listener for room:", roomId);
      off(roomRef, 'value', listener);
    };
  }, [roomId, user, navigate]);

  const cancelRoom = async () => {
    if (roomData && roomData.hostId === user.uid && roomData.status === 'waiting') {
      const roomRef = ref(db, `rooms/${roomId}`);
      await remove(roomRef);
      safeNavigate('/online');
    }
  };

  const handleSquareClick = (square) => {
      console.log(`Square clicked: ${square}, isMyTurn: ${isMyTurn}`);
      if (!isMyTurn || roomData?.status !== 'playing') {
          console.log("Not allowed to move now.");
          return;
      }

      const currentGame = gameRef.current;

      if (selectedSquare === null) {
          const piece = currentGame.get(square);
          if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
              setSelectedSquare(square);
              console.log(`Selected piece at ${square}`);
          } else {
              console.log(`Cannot select square ${square}. Piece:`, piece);
          }
      } else {
          if (square === selectedSquare) {
              setSelectedSquare(null);
              console.log("Deselected square");
              return;
          }

          console.log(`Attempting move from ${selectedSquare} to ${square}`);
          const tempGame = new Chess(currentGame.fen());
          let moveResult = null;
          try {
              moveResult = tempGame.move({
                  from: selectedSquare,
                  to: square,
                  promotion: 'q'
              });
          } catch (e) {
              console.warn("Invalid move according to chess.js:", e.message);
              setSelectedSquare(null);
              return;
          }

          if (moveResult) {
              console.log("Move is valid:", moveResult.san);
              const moveData = {
                  from: moveResult.from,
                  to: moveResult.to,
                  san: moveResult.san,
                  piece: moveResult.piece,
                  color: moveResult.color === 'w' ? 'white' : 'black'
              };

              if (moveResult.promotion) {
                  moveData.promotion = moveResult.promotion;
              }

              const currentMoves = roomData?.moves || [];
              const newMoves = [...currentMoves, moveData];

              // Update timers
              const updates = { moves: newMoves };
              
              if (timerSettings.isEnabled) {
                if (timerSettings.timerType === 'total') {
                  // Update the appropriate timer based on whose turn just ended
                  const isWhiteMove = moveResult.color === 'w';
                  if (isWhiteMove) {
                    updates.whiteTime = whiteTime;
                  } else {
                    updates.blackTime = blackTime;
                  }
                } else if (timerSettings.timerType === 'perMove') {
                  // Reset the per-move timer
                  updates.currentMoveTime = timerSettings.perMoveTime;
                }
              }

              console.log("Writing new moves and timer data to Firebase:", updates);
              update(ref(db, `rooms/${roomId}`), updates)
                  .then(() => {
                      console.log("Move and timer successfully written to Firebase.");
                  })
                  .catch((error) => {
                      console.error("Firebase write error:", error);
                  });
          } else {
             console.log("Move was not valid.");
          }
          setSelectedSquare(null);
      }
  };

  const handleTimeUp = () => {
    if (!isPaused && timerSettings.isEnabled) {
      const currentTurn = gameRef.current.turn();
      const gameResult = {
        status: 'completed',
        winner: currentTurn === 'w' ? 'black' : 'white',
        reason: 'timeout'
      };
      
      // Update game result in the database
      update(ref(db, `rooms/${roomId}`), gameResult)
        .then(() => {
          console.log("Game ended due to timeout");
        })
        .catch((error) => {
          console.error("Failed to update game result:", error);
        });
    }
  };

  const handleMoveComplete = () => {
    if (timerSettings.timerType === 'perMove') {
      setCurrentMoveTime(timerSettings.perMoveTime);
      
      // Update the per-move timer in the database
      update(ref(db, `rooms/${roomId}`), {
        currentMoveTime: timerSettings.perMoveTime
      }).catch(err => console.error("Failed to update move timer:", err));
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    update(ref(db, `rooms/${roomId}`), { isPaused: true })
      .catch(err => console.error("Failed to pause game:", err));
  };

  const handleResume = () => {
    setIsPaused(false);
    update(ref(db, `rooms/${roomId}`), { isPaused: false })
      .catch(err => console.error("Failed to resume game:", err));
  };

  // Determine if the game is active (for exit confirmation)
  const isGameActive = roomData?.status === 'playing' && 
                      !gameRef.current?.isGameOver() && 
                      !roomData?.winner;

  // Handle opponent notification when player leaves
  const notifyOpponentForfeit = useCallback((data = {}) => {
    console.log("notifyOpponentForfeit called with data:", data);
    
    if (roomData && roomId && user && roomData.status === 'playing') {
      console.log("Updating game result in Firebase due to forfeit. Player color:", playerColor);
      
      const gameResult = {
        status: 'completed',
        winner: playerColor === 'white' ? 'black' : 'white',
        reason: 'forfeit'
      };
      
      update(ref(db, `rooms/${roomId}`), gameResult)
        .then(() => {
          console.log("Game ended due to player forfeit. Winner:", gameResult.winner);
        })
        .catch((error) => {
          console.error("Failed to update game result:", error);
        });
    } else {
      console.log("Cannot update forfeit - conditions not met:", {
        hasRoomData: !!roomData,
        roomId: roomId,
        hasUser: !!user,
        roomStatus: roomData?.status
      });
    }
  }, [roomId, roomData, playerColor, user]);

  if (!user) {
    return <div className="loading-message">Đang xác thực người dùng...</div>;
  }

  if (!roomData || !playerColor) {
    return <div className="loading-message">Đang tải thông tin phòng...</div>;
  }

  if (roomData.status === 'waiting') {
    const isHost = roomData && user && roomData.hostId === user.uid;
    return (
      <div className="waiting-room">
        <h2>Đang chờ đối thủ...</h2>
        <p>Mã phòng của bạn là:</p>
        <div className="room-code-display">{roomId}</div>
        <p>Hãy chia sẻ mã này cho bạn bè để họ tham gia.</p>
        <p>Bạn đang chọn quân: {playerColor === 'white' ? 'Trắng ⚪' : 'Đen ⚫'}</p>
        {isHost && (
          <button onClick={cancelRoom} className="cancel-button">Hủy phòng</button>
        )}
      </div>
    );
  }

  const customSquareStyles = {};
  if (selectedSquare) {
      customSquareStyles[selectedSquare] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
      try {
          const moves = gameRef.current.moves({ square: selectedSquare, verbose: true });
          moves.forEach(move => {
              customSquareStyles[move.to] = { backgroundColor: "rgba(0, 255, 0, 0.2)" };
          });
      } catch (e) {}
  }

  return (
    <div className="chess-container online-game">
      <GameExitHandler 
        isGameActive={isGameActive}
        message="Bạn sẽ bị xử thua nếu rời khỏi ván đấu. Rời đi?"
        onExitConfirm={() => console.log("Người chơi xác nhận thoát")}
        notifyOpponent={notifyOpponentForfeit}
        gameEnded={roomData?.status === 'completed' || gameRef.current?.isGameOver() || !!roomData?.winner}
      />
      
      {/* {showGameOverModal && (
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
       */}
      <div className="game-info">
        <div className="room-code">Phòng: {roomId}</div>
        <div className="players-info">
          <div>⚪ Trắng: {Object.values(roomData.players).find(p => p.color === 'white')?.name || '...'}</div>
          <div>⚫ Đen: {Object.values(roomData.players).find(p => p.color === 'black')?.name || '...'}</div>
        </div>
        <div className="turn-indicator">Lượt đi: {gameRef.current.turn() === 'w' ? 'Trắng' : 'Đen'} </div>
        {gameRef.current.isGameOver() && (
          <div className="game-status">
            {gameRef.current.isCheckmate() ?
              `Chiếu hết! ${gameRef.current.turn() === 'w' ? 'Đen' : 'Trắng'} thắng!` :
              gameRef.current.isDraw() ? 'Hòa!' : 'Game kết thúc!'}
          </div>
        )}
        {roomData.winner && (
          <div className="game-status">
            {`${roomData.winner === 'white' ? 'Trắng' : 'Đen'} thắng! ${roomData.reason === 'timeout' ? '(Do timeout)' : ''}`}
          </div>
        )}
      </div>

      {timerSettings.isEnabled && (
        <div className="timers">
          <div className="white-timer">
            <div>Trắng ⚪</div>
            <Timer
              initialTime={timerSettings.timerType === 'total' ? roomData.whiteTime || whiteTime : roomData.currentMoveTime || currentMoveTime}
              isActive={!isPaused && !gameRef.current.isGameOver() && gameRef.current.turn() === 'w' && roomData.status === 'playing'}
              onTimeUp={handleTimeUp}
              timerType={timerSettings.timerType}
              onMoveComplete={handleMoveComplete}
            />
          </div>
          <div className="black-timer">
            <div>Đen ⚫</div>
            <Timer
              initialTime={timerSettings.timerType === 'total' ? roomData.blackTime || blackTime : roomData.currentMoveTime || currentMoveTime}
              isActive={!isPaused && !gameRef.current.isGameOver() && gameRef.current.turn() === 'b' && roomData.status === 'playing'}
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
            position={fen}
            onSquareClick={handleSquareClick}
            boardOrientation={playerColor === 'black' ? 'black' : 'white'}
            customSquareStyles={customSquareStyles}
            areArrowsAllowed={false}
            isDraggablePiece={() => false}
            boardWidth={480}
          />
        </div>

        <MoveHistory 
          moves={roomData?.moves || []} 
          boardOrientation={playerColor}
        />
      </div>
    </div>
  );
};

export default OnlineGameRoom;