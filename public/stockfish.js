/* Stockfish.js web worker - simplified chess engine for browser use */

// Keep track of the current position and state
let currentFen = '';
let currentTurn = '';
let lastCommand = '';
let isProcessingCommand = false;
let commandTimestamp = 0;  // Track when we received the last command
let lastGeneratedMove = null; // Track the last move we generated
let processingPosition = false; // Flag to prevent multiple position processing

/**
 * Entry point for all messages from the main thread
 */
self.onmessage = function(event) {
  // Skip processing if we don't have proper data
  if (!event) return;
  
  let message;
  
  // Extract the actual message data regardless of format
  try {
    // Handle both MessageEvent objects and direct data
    if (event.data !== undefined) {
      message = event.data;
    } else {
      message = event;
    }
    
    // Convert message to a usable format
    if (typeof message === 'string') {
      // String messages can be processed directly
      processMessage(message);
    } 
    else if (message && typeof message === 'object') {
      // Extract a usable string from the object
      if (message.command && typeof message.command === 'string') {
        processMessage(message.command);
      } 
      else if (message.msg && typeof message.msg === 'string') {
        processMessage(message.msg);
      }
      else if (message.fen && typeof message.fen === 'string') {
        processMessage('position fen ' + message.fen);
      }
      else {
        // Try to get a useful string representation, but don't log errors
        const stringVersion = String(message).trim();
        if (stringVersion && stringVersion !== '[object Object]') {
          processMessage(stringVersion);
        }
      }
    }
  } catch (err) {
    console.error("Error processing message:", err);
  }
};

/**
 * Process a normalized message string
 */
function processMessage(command) {
  // Skip duplicate commands and prevent processing multiple position commands at once
  if (command === lastCommand && !command.startsWith('position')) {
    console.debug('Skipping duplicate command:', command);
    return;
  }
  
  // Special handling for position commands to avoid conflicts
  if (command.startsWith('position')) {
    // Skip if we're already processing a position command
    if (processingPosition) {
      console.debug('Already processing a position command, skipping:', command);
      return;
    }
    processingPosition = true;
  }
  
  lastCommand = command;
  const now = Date.now();
  
  // Log important commands for debugging
  if (command.startsWith('position')) {
    console.log('Stockfish received position command:', command);
    commandTimestamp = now;
    
    // Clear any cached moves when position changes
    lastGeneratedMove = null;
  } 
  
  // Defer execution slightly to avoid race conditions
  setTimeout(() => {
    try {
      // Only process if this is still the most recent command
      // (unless it's a non-position command)
      if (!command.startsWith('position') || now === commandTimestamp) {
        handleCommand(command);
      } else {
        console.debug('Skipping outdated position command');
      }
    } catch (err) {
      console.error("Error handling command:", err);
    } finally {
      if (command.startsWith('position')) {
        processingPosition = false;
      }
    }
  }, 0);
}

/**
 * Handle specific UCI commands
 */
function handleCommand(cmd) {
  if (isProcessingCommand) {
    // Queue commands if we're already processing one
    setTimeout(() => handleCommand(cmd), 10);
    return;
  }
  
  isProcessingCommand = true;
  
  try {
    if (cmd === 'uci') {
      self.postMessage('id name Stockfish JS');
      self.postMessage('id author Stockfish Team');
      self.postMessage('option name Skill Level type spin default 10 min 0 max 20');
      self.postMessage('option name Threads type spin default 1 min 1 max 8');
      self.postMessage('option name Hash type spin default 16 min 1 max 128');
      self.postMessage('uciok');
    } 
    else if (cmd === 'isready') {
      self.postMessage('readyok');
    }
    else if (cmd.startsWith('position')) {
      let newFen = '';
      
      // Extract FEN from position command
      if (cmd.includes('fen ')) {
        newFen = cmd.split('fen ')[1].trim().split(' moves ')[0];
      } else if (cmd.includes('startpos')) {
        newFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      
      // Skip if we're given an invalid FEN or identical to previous
      if (!newFen || newFen.split(' ').length < 4) {
        console.error("Invalid FEN received:", newFen);
        isProcessingCommand = false;
        return;
      }
      
      // Update our state with the new position
      currentFen = newFen;
      
      // Extract turn from FEN
      const fenParts = currentFen.split(' ');
      if (fenParts.length >= 2) {
        currentTurn = fenParts[1]; // 'w' or 'b'
      }
      
      // Log the position for debugging
      console.log("Position set:", currentFen, "Turn:", currentTurn);
    }
    else if (cmd.startsWith('go')) {
      // Make sure we're processing the current position, not a stale one
      if (!currentFen || currentFen.split(' ').length < 4) {
        console.error("No valid position set for 'go' command");
        isProcessingCommand = false;
        return;
      }
      
      let moveTimeMs = 500; // Default time
      
      // Parse movetime if provided
      if (cmd.includes('movetime')) {
        const moveTimeMatch = cmd.match(/movetime\s+(\d+)/);
        if (moveTimeMatch && moveTimeMatch[1]) {
          moveTimeMs = parseInt(moveTimeMatch[1]);
        }
      } else if (cmd.includes('depth')) {
        // For depth-based search, use scaled timing
        const depthMatch = cmd.match(/depth\s+(\d+)/);
        if (depthMatch && depthMatch[1]) {
          const depth = parseInt(depthMatch[1]);
          moveTimeMs = Math.min(depth * 100, 2000); // Scale with depth, max 2 sec
        }
      }
      
      // Verify we have a valid turn indicator
      if (currentTurn !== 'w' && currentTurn !== 'b') {
        console.error("Invalid turn indicator:", currentTurn);
        isProcessingCommand = false;
        return;
      }
      
      // Store these in local variables to prevent race conditions
      const fen = currentFen;
      const turn = currentTurn;
      
      console.log("Go command received for position:", fen, "Turn:", turn);
      
      // Generate a move after "thinking"
      setTimeout(() => {
        try {
          // Use a simple move generation approach
          const bestMove = generateBestMove(fen, turn);
          
          // Verify this move doesn't match our last generated move
          if (bestMove !== lastGeneratedMove) {
            lastGeneratedMove = bestMove;
            self.postMessage('bestmove ' + bestMove);
            console.log(`Generated move for ${turn}: ${bestMove}`);
          } else {
            console.warn("Avoiding duplicate move, generating alternative");
            // Generate an alternative move
            const alternativeMove = generateAlternativeMove(fen, turn, bestMove);
            lastGeneratedMove = alternativeMove;
            self.postMessage('bestmove ' + alternativeMove);
            console.log(`Generated alternative move for ${turn}: ${alternativeMove}`);
          }
        } catch (e) {
          console.error("Error generating move:", e);
          
          // Fallback to a simple pawn move if possible
          const fallbackMove = getFallbackMove(turn);
          self.postMessage('bestmove ' + fallbackMove);
          console.log(`Generated fallback move for ${turn}: ${fallbackMove}`);
        } finally {
          isProcessingCommand = false;
        }
      }, moveTimeMs * 0.3); // Respond faster than requested to avoid timeout issues
      
      // We'll release the processing lock when the move is generated
      return;
    }
    else if (cmd.startsWith('setoption')) {
      // Silently accept options
    }
    else if (cmd === 'quit' || cmd === 'stop') {
      // Nothing special needed
    }
  } finally {
    // Release the processing lock for all commands except 'go'
    // (go releases it after generating the move)
    if (!cmd.startsWith('go')) {
      isProcessingCommand = false;
    }
  }
}

/**
 * Generate a best move for the given position
 */
function generateBestMove(fen, turn) {
  // Parse the position
  const board = parseFEN(fen);
  
  // Generate legal moves for the turn
  const legalMoves = generateLegalMoves(board, turn);
  
  if (!legalMoves || legalMoves.length === 0) {
    throw new Error(`No legal moves found for ${turn} in position ${fen}`);
  }
  
  console.log(`Found ${legalMoves.length} legal moves for ${turn}`);
  
  // Look for standard openings first
  if (isEarlyPosition(fen)) {
    const bookMove = getOpeningBookMove(fen, turn);
    if (bookMove && legalMoves.includes(bookMove)) {
      console.log("Using opening book move:", bookMove);
      return bookMove;
    }
  }
  
  // Simple evaluation of each move
  const moveScores = [];
  
  for (const move of legalMoves) {
    try {
      // Apply the move to a new board
      const newPosition = makeMove(board, move);
      // Score the resulting position
      const score = evaluatePosition(newPosition, turn);
      moveScores.push({ move, score });
    } catch (err) {
      console.warn("Error evaluating move:", move, err);
    }
  }
  
  // Sort moves by score (higher is better)
  moveScores.sort((a, b) => b.score - a.score);
  
  // Pick one of the top 3 moves (with preference to the best)
  const topMoves = moveScores.slice(0, Math.min(3, moveScores.length));
  
  // Weighted random selection - best move has 60% chance, 2nd has 30%, 3rd has 10%
  const rand = Math.random();
  if (rand < 0.6 || topMoves.length === 1) {
    return topMoves[0].move;
  } else if (rand < 0.9 || topMoves.length === 2) {
    return topMoves[1].move;
  } else {
    return topMoves[2].move;
  }
}

/**
 * Generate an alternative move that's different from the best move
 */
function generateAlternativeMove(fen, turn, bestMove) {
  const board = parseFEN(fen);
  const legalMoves = generateLegalMoves(board, turn);
  
  // Filter out the best move we want to avoid
  const alternativeMoves = legalMoves.filter(move => move !== bestMove);
  
  if (alternativeMoves.length === 0) {
    // If there's only one legal move, we have to use it
    return bestMove;
  }
  
  // Pick a random alternative
  return alternativeMoves[Math.floor(Math.random() * alternativeMoves.length)];
}

/**
 * Get a move from common opening theory
 */
function getOpeningBookMove(fen, turn) {
  // Define some standard opening book moves
  const openingBook = {
    // Starting position
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w': ['e2e4', 'd2d4', 'g1f3', 'c2c4'],
    // Common black responses to e4
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
    // Common black responses to d4
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b': ['d7d5', 'g8f6', 'e7e6', 'c7c5'],
    // Common white responses after e4 e5
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w': ['g1f3', 'b1c3', 'd2d4', 'f1c4'],
    // Common white responses after e4 c5
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w': ['g1f3', 'b1c3', 'd2d4', 'c2c3'],
  };
  
  // Simplify the FEN to match our book keys
  const simpleFen = fen.split(' ').slice(0, 2).join(' ');
  
  const moves = openingBook[simpleFen];
  if (moves && moves.length > 0) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  return null;
}

/**
 * Get a fallback move if all else fails
 */
function getFallbackMove(turn) {
  const safeCommonMoves = {
    'w': ['e2e4', 'd2d4', 'g1f3', 'b1c3'],
    'b': ['e7e5', 'd7d5', 'g8f6', 'b8c6']
  };
  
  const moves = safeCommonMoves[turn];
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Generate legal moves for the current position
 */
function generateLegalMoves(board, turn) {
  const legalMoves = [];
  const isWhite = turn === 'w';
  
  // Convert between algebraic notation and array indices
  const coordToIndices = (square) => ({
    row: 8 - parseInt(square[1]),
    col: square.charCodeAt(0) - 'a'.charCodeAt(0)
  });
  
  const indicesToCoord = (row, col) => (
    String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row)
  );
  
  // Find all pieces of the current side
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      // Check if this is a piece of the current side
      const isPieceWhite = piece === piece.toUpperCase();
      if (isPieceWhite !== isWhite) continue;
      
      const from = indicesToCoord(row, col);
      const pieceType = piece.toLowerCase();
      
      // Generate moves based on piece type
      switch (pieceType) {
        case 'p': // Pawn
          generatePawnMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord);
          break;
        case 'n': // Knight
          generateKnightMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord);
          break;
        case 'b': // Bishop
          generateSlidingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord, true, false);
          break;
        case 'r': // Rook
          generateSlidingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord, false, true);
          break;
        case 'q': // Queen
          generateSlidingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord, true, true);
          break;
        case 'k': // King
          generateKingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord);
          break;
      }
    }
  }
  
  return legalMoves;
}

/**
 * Generate pawn moves
 */
function generatePawnMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord) {
  // Pawns move differently based on color
  const direction = isWhite ? -1 : 1;
  const startingRow = isWhite ? 6 : 1;
  
  // Forward move
  const newRow = row + direction;
  if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
    const to = indicesToCoord(newRow, col);
    
    // Check for promotion
    if (newRow === 0 || newRow === 7) {
      legalMoves.push(from + to + 'q'); // Default to queen promotion
    } else {
      legalMoves.push(from + to);
    }
    
    // Double move from starting position
    if (row === startingRow && !board[row + 2 * direction][col]) {
      const to2 = indicesToCoord(row + 2 * direction, col);
      legalMoves.push(from + to2);
    }
  }
  
  // Captures
  for (const colOffset of [-1, 1]) {
    const newCol = col + colOffset;
    if (newCol >= 0 && newCol < 8) {
      const newRow = row + direction;
      if (newRow >= 0 && newRow < 8) {
        const target = board[newRow][newCol];
        if (target && (isWhite !== (target === target.toUpperCase()))) {
          const to = indicesToCoord(newRow, newCol);
          
          // Check for promotion
          if (newRow === 0 || newRow === 7) {
            legalMoves.push(from + to + 'q'); // Default to queen promotion
          } else {
            legalMoves.push(from + to);
          }
        }
      }
    }
  }
}

/**
 * Generate knight moves
 */
function generateKnightMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord) {
  const offsets = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2], [1, 2],
    [2, -1], [2, 1]
  ];
  
  for (const [rowOffset, colOffset] of offsets) {
    const newRow = row + rowOffset;
    const newCol = col + colOffset;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || (isWhite !== (target === target.toUpperCase()))) {
        const to = indicesToCoord(newRow, newCol);
        legalMoves.push(from + to);
      }
    }
  }
}

/**
 * Generate sliding piece moves (bishop, rook, queen)
 */
function generateSlidingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord, diagonal, straight) {
  const directions = [];
  
  if (diagonal) {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  }
  
  if (straight) {
    directions.push([0, -1], [0, 1], [-1, 0], [1, 0]);
  }
  
  for (const [rowDir, colDir] of directions) {
    let newRow = row + rowDir;
    let newCol = col + colDir;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      
      if (!target) {
        // Empty square - can move here
        const to = indicesToCoord(newRow, newCol);
        legalMoves.push(from + to);
      } else {
        // Occupied square - can capture if opponent's piece, then stop
        if (isWhite !== (target === target.toUpperCase())) {
          const to = indicesToCoord(newRow, newCol);
          legalMoves.push(from + to);
        }
        break;
      }
      
      newRow += rowDir;
      newCol += colDir;
    }
  }
}

/**
 * Generate king moves including castling
 */
function generateKingMoves(board, row, col, isWhite, from, legalMoves, indicesToCoord) {
  // Regular king moves
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  
  for (const [rowOffset, colOffset] of offsets) {
    const newRow = row + rowOffset;
    const newCol = col + colOffset;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || (isWhite !== (target === target.toUpperCase()))) {
        const to = indicesToCoord(newRow, newCol);
        legalMoves.push(from + to);
      }
    }
  }
  
  // Castling logic
  if (isWhite && row === 7 && col === 4) {
    // White king in starting position
    if (!board[7][5] && !board[7][6] && board[7][7] === 'R') {
      legalMoves.push('e1g1'); // Kingside castling
    }
    if (!board[7][3] && !board[7][2] && !board[7][1] && board[7][0] === 'R') {
      legalMoves.push('e1c1'); // Queenside castling
    }
  } else if (!isWhite && row === 0 && col === 4) {
    // Black king in starting position
    if (!board[0][5] && !board[0][6] && board[0][7] === 'r') {
      legalMoves.push('e8g8'); // Kingside castling
    }
    if (!board[0][3] && !board[0][2] && !board[0][1] && board[0][0] === 'r') {
      legalMoves.push('e8c8'); // Queenside castling
    }
  }
}

/**
 * Make a move on the board and return the new position
 */
function makeMove(board, moveStr) {
  // Create a deep copy of the board
  const newBoard = board.map(row => [...row]);
  
  // Parse the move
  const from = moveStr.substring(0, 2);
  const to = moveStr.substring(2, 4);
  const promotion = moveStr.length > 4 ? moveStr[4] : null;
  
  // Convert coordinates to indices
  const fromCoord = {
    row: 8 - parseInt(from[1]),
    col: from.charCodeAt(0) - 'a'.charCodeAt(0)
  };
  
  const toCoord = {
    row: 8 - parseInt(to[1]),
    col: to.charCodeAt(0) - 'a'.charCodeAt(0)
  };
  
  // Get the piece being moved
  const piece = newBoard[fromCoord.row][fromCoord.col];
  if (!piece) {
    throw new Error(`No piece at ${from}`);
  }
  
  // Check for castling
  if (piece.toLowerCase() === 'k' && Math.abs(fromCoord.col - toCoord.col) === 2) {
    // Kingside castling
    if (toCoord.col > fromCoord.col) {
      const rookCol = 7;
      const newRookCol = fromCoord.col + 1;
      newBoard[fromCoord.row][newRookCol] = newBoard[fromCoord.row][rookCol];
      newBoard[fromCoord.row][rookCol] = null;
    } 
    // Queenside castling
    else {
      const rookCol = 0;
      const newRookCol = fromCoord.col - 1;
      newBoard[fromCoord.row][newRookCol] = newBoard[fromCoord.row][rookCol];
      newBoard[fromCoord.row][rookCol] = null;
    }
  }
  
  // Move the piece
  newBoard[toCoord.row][toCoord.col] = piece;
  newBoard[fromCoord.row][fromCoord.col] = null;
  
  // Handle pawn promotion
  if (piece.toLowerCase() === 'p' && (toCoord.row === 0 || toCoord.row === 7) && promotion) {
    const isWhite = piece === piece.toUpperCase();
    newBoard[toCoord.row][toCoord.col] = isWhite ? promotion.toUpperCase() : promotion.toLowerCase();
  }
  
  return newBoard;
}

/**
 * Basic position evaluation function
 */
function evaluatePosition(board, side) {
  const pieceValues = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
  };
  
  // Center control bonus
  const centerBonus = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 10, 10, 10, 10, 10, 10, 0],
    [0, 10, 20, 20, 20, 20, 10, 0],
    [0, 10, 20, 30, 30, 20, 10, 0],
    [0, 10, 20, 30, 30, 20, 10, 0],
    [0, 10, 20, 20, 20, 20, 10, 0],
    [0, 10, 10, 10, 10, 10, 10, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];
  
  let whiteScore = 0;
  let blackScore = 0;
  
  // Count material and position value
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const pieceType = piece.toLowerCase();
      const isWhite = piece === piece.toUpperCase();
      
      // Add material value
      const value = pieceValues[pieceType] || 0;
      
      // Add position bonus
      const bonus = centerBonus[row][col];
      
      if (isWhite) {
        whiteScore += value + bonus;
      } else {
        blackScore += value + bonus;
      }
    }
  }
  
  // Return the score from the perspective of the side to move
  return side === 'w' ? (whiteScore - blackScore) : (blackScore - whiteScore);
}

/**
 * Check if this is an early position in the game
 */
function isEarlyPosition(fen) {
  // Count pieces to estimate game phase
  const pieceCount = (fen.split('/').join('') || "")
    .replace(/[^pnbrqkPNBRQK]/g, '')
    .length;
  return pieceCount >= 28; // Most pieces still on board
}

/**
 * Parse a FEN string into a board representation
 */
function parseFEN(fen) {
  try {
    const fenParts = fen.split(' ');
    const board = [];
    const rows = fenParts[0].split('/');
    
    for (let i = 0; i < 8; i++) {
      const row = [];
      let col = 0;
      
      for (let j = 0; j < rows[i].length; j++) {
        const c = rows[i][j];
        if ('12345678'.includes(c)) {
          // Empty squares
          const emptyCount = parseInt(c, 10);
          for (let k = 0; k < emptyCount; k++) {
            row.push(null);
            col++;
          }
        } else {
          // Piece
          row.push(c);
          col++;
        }
      }
      
      board.push(row);
    }
    
    return board;
  } catch (err) {
    console.error("Error parsing FEN:", err);
    // Return empty board if parsing fails
    return Array(8).fill().map(() => Array(8).fill(null));
  }
}

// Let the main thread know we're ready
self.postMessage('Worker initialized');