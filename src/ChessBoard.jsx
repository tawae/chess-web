import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  const handleSquareClick = (square) => {
    // Lấy danh sách các nước đi hợp lệ cho quân cờ được chọn
    const moves = game.moves({ square: selectedSquare, verbose: true });
    const validMoves = moves.map(move => move.to);

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

      // Chỉ cho phép di chuyển đến ô hợp lệ
      if (validMoves.includes(square)) {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });

        if (move) {
          setGame(gameCopy);
          // Thêm nước đi vào lịch sử
          setMoveHistory(prev => [...prev, {
            piece: move.piece,
            from: move.from,
            to: move.to,
            san: move.san
          }]);
        }
      }
      setSelectedSquare(null);
    }
  };

  return (
    <div className="chess-container">
      <Chessboard 
        position={game.fen()} 
        onSquareClick={handleSquareClick}
        customSquareStyles={{
          ...(selectedSquare && {
            [selectedSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
            ...(game.moves({ square: selectedSquare, verbose: true })
              .reduce((obj, move) => {
                obj[move.to] = { backgroundColor: "rgba(0, 255, 0, 0.2)" };
                return obj;
              }, {}))
          })
        }}
        boardWidth={400}
        areArrowsAllowed={false}
        isDraggablePiece={() => false}
      />
      <div className="move-history">
        <h3 className="move-history-title">Lịch sử nước đi</h3>
        <div>
          {moveHistory.map((move, index) => (
            <div key={index} className="move-item">
              {index + 1}. {move.san}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
