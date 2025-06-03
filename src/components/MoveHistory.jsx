import React from 'react';

const MoveHistory = ({ moves = [], boardOrientation = 'white' }) => {
  // Mapping of piece symbols to Unicode chess pieces
  const pieceIcons = {
    'p': { white: '♙', black: '♟' },
    'n': { white: '♘', black: '♞' },
    'b': { white: '♗', black: '♝' },
    'r': { white: '♖', black: '♜' },
    'q': { white: '♕', black: '♛' },
    'k': { white: '♔', black: '♚' }
  };

  // Get square notation (e.g., 'e4') from a square position
  const formatSquare = (square) => {
    if (!square || square.length !== 2) return '';
    return square;
  };
  
  const getPieceIcon = (piece, color) => {
    if (!piece) return '';
    const pieceType = piece.toLowerCase();
    const pieceColor = color === 'w' ? 'white' : 'black';
    return pieceIcons[pieceType]?.[pieceColor] || '';
  };

  return (
    <div className="move-history">
      <h3>Lịch sử nước đi</h3>
      <div className="moves-list">
        {moves.length === 0 ? (
          <div className="no-moves">Chưa có nước đi nào</div>
        ) : (
          <>
            {moves.map((move, index) => {
              const isWhiteMove = index % 2 === 0;
              const moveNumber = Math.floor(index / 2) + 1;
              const color = move.color === 'white' || move.color === 'w' ? 'white' : 'black';
              const pieceType = move.piece || '';
              const pieceIcon = getPieceIcon(pieceType, color === 'white' ? 'w' : 'b');
              const fromSquare = formatSquare(move.from);
              const toSquare = formatSquare(move.to);
              const isCastle = pieceType?.toLowerCase() === 'k' && 
                ((fromSquare === 'e1' && (toSquare === 'g1' || toSquare === 'c1')) || 
                (fromSquare === 'e8' && (toSquare === 'g8' || toSquare === 'c8')));
              const isCapture = move.flags && move.flags.includes('c');
              
              return (
                <div key={index} className={`move-item ${color}`}>
                  {isWhiteMove && <span className="move-number">{moveNumber}.</span>}
                  <span className={`piece-icon ${color}`}>{pieceIcon}</span>
                  {isCapture ? (
                    <span className="move-notation">
                      {fromSquare} <span className="capture-symbol">×</span> {toSquare}
                    </span>
                  ) : isCastle ? (
                    <span className="move-notation">
                      {toSquare[1] === '1' ? (toSquare === 'g1' ? '0-0' : '0-0-0') : (toSquare === 'g8' ? '0-0' : '0-0-0')}
                    </span>
                  ) : (
                    <span className="move-notation">
                      {fromSquare} → {toSquare}
                    </span>
                  )}
                  {move.promotion && (
                    <span className="promotion-piece">
                      = {getPieceIcon(move.promotion, color === 'white' ? 'w' : 'b')}
                    </span>
                  )}
                  {move.san && (
                    <span className="san-notation">({move.san})</span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;