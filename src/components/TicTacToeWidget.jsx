import React, { useState, useEffect, useCallback } from 'react';
import { Gamepad2, X as CloseIcon, RotateCcw, Trophy, User, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';

export default function TicTacToeWidget({ isOpen, onClose, ydoc, currentUser }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState({ X: null, O: null });
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 450 });

  const gameMap = ydoc.getMap('tictactoe');

  useEffect(() => {
    if (!gameMap) return;

    const updateState = () => {
      const b = gameMap.get('board') || Array(9).fill(null);
      const t = gameMap.get('turn') || 'X';
      const w = gameMap.get('winner') || null;
      const p = gameMap.get('players') || { X: null, O: null };
      
      setBoard(b);
      setTurn(t);
      setWinner(w);
      setPlayers(p);
    };

    gameMap.observe(updateState);
    updateState();

    return () => gameMap.unobserve(updateState);
  }, [gameMap]);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diags
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(s => s !== null)) return 'Draw';
    return null;
  };

  const handleCellClick = (index) => {
    if (board[index] || winner) return;
    
    // Check if it's user's turn
    const currentPlayerId = players[turn];
    if (currentPlayerId && currentPlayerId !== currentUser.id) return;

    // Auto-assign player if not assigned
    const newPlayers = { ...players };
    if (!players[turn]) {
        newPlayers[turn] = currentUser.id;
    }

    const newBoard = [...board];
    newBoard[index] = turn;
    const newWinner = checkWinner(newBoard);
    const nextTurn = turn === 'X' ? 'O' : 'X';

    ydoc.transact(() => {
      gameMap.set('board', newBoard);
      gameMap.set('turn', nextTurn);
      gameMap.set('winner', newWinner);
      gameMap.set('players', newPlayers);
    }, 'local');
  };

  const handleReset = () => {
    ydoc.transact(() => {
      gameMap.set('board', Array(9).fill(null));
      gameMap.set('turn', 'X');
      gameMap.set('winner', null);
      // Keep players for rematch or clear? Let's clear
      gameMap.set('players', { X: null, O: null });
    }, 'local');
  };

  const joinGame = (symbol) => {
    if (players[symbol]) return;
    const newPlayers = { ...players, [symbol]: currentUser.id };
    ydoc.transact(() => {
      gameMap.set('players', newPlayers);
    }, 'local');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      style={{ left: position.x, top: position.y }}
      className="fixed w-72 bg-white rounded-3xl shadow-4xl border border-gray-100 z-[5000] overflow-hidden flex flex-col font-sans"
    >
      {/* Header */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Gamepad2 size={16} />
          </div>
          <span className="font-bold text-gray-800 text-xs">Tic Tac Toe</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
          <CloseIcon size={14} />
        </button>
      </div>

      {/* Players Info */}
      <div className="p-4 flex justify-between items-center bg-white">
        <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${turn === 'X' ? 'border-indigo-500 bg-indigo-50' : 'border-transparent opacity-60'}`}>
           <span className="text-xl font-black text-indigo-600">X</span>
           {players.X ? (
             <div className="flex items-center gap-1 text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                <User size={8} />
                {players.X === currentUser.id ? 'YOU' : 'OTHER'}
             </div>
           ) : (
             <button onClick={() => joinGame('X')} className="text-[8px] font-bold text-indigo-500 hover:underline flex items-center gap-1 uppercase">
                <UserPlus size={8} /> Join
             </button>
           )}
        </div>
        
        <div className="text-[10px] font-bold text-gray-300 uppercase">VS</div>

        <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${turn === 'O' ? 'border-pink-500 bg-pink-50' : 'border-transparent opacity-60'}`}>
           <span className="text-xl font-black text-pink-600">O</span>
           {players.O ? (
             <div className="flex items-center gap-1 text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                <User size={8} />
                {players.O === currentUser.id ? 'YOU' : 'OTHER'}
             </div>
           ) : (
             <button onClick={() => joinGame('O')} className="text-[8px] font-bold text-pink-500 hover:underline flex items-center gap-1 uppercase">
                <UserPlus size={8} /> Join
             </button>
           )}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 rounded-2xl">
          {board.map((cell, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCellClick(i)}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-black transition-all ${
                cell === 'X' ? 'bg-white text-indigo-600 shadow-sm' : 
                cell === 'O' ? 'bg-white text-pink-600 shadow-sm' : 
                'bg-white/50 hover:bg-white text-transparent'
              }`}
            >
              {cell}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-white">
        {winner ? (
          <div className="flex items-center gap-2 text-indigo-600 animate-bounce">
             <Trophy size={16} />
             <span className="font-bold text-xs">
                {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
             </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
             <div className={`w-2 h-2 rounded-full animate-pulse ${turn === 'X' ? 'bg-indigo-500' : 'bg-pink-500'}`} />
             <span className="font-bold text-[10px] uppercase tracking-wider">{turn}'s Turn</span>
          </div>
        )}
        <button 
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          title="Reset Game"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </motion.div>
  );
}
