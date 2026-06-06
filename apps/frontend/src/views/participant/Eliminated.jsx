import React from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../../stores/useGameStore';

export default function Eliminated() {
  const navigate = useNavigate();
  const { playerInfo, score } = useGameStore();

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col font-body-md text-white">
      
      {/* Header */}
      <header className="h-16 md:h-20 shrink-0 bg-[#0A0A0B] border-b border-[#1f2937] flex justify-center items-center px-4 md:px-8 z-20">
        <div className="text-xl md:text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* Red background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600 rounded-full blur-[200px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md text-center">
          
          {/* Eliminated icon */}
          <div className="w-24 h-24 rounded-full bg-[#450a0a] border-4 border-[#7f1d1d] flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-[#fca5a5]" style={{ fontVariationSettings: "'FILL' 1" }}>
              heart_broken
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-[40px] md:text-[56px] font-black font-display-lg text-[#fca5a5] tracking-wide uppercase leading-none mb-3">
              ELIMINATED
            </h1>
            <p className="text-lg text-gray-400 font-medium">
              You fought valiantly, {playerInfo?.nickname || 'Player'}!
            </p>
          </div>

          {/* Score Card */}
          <div className="w-full bg-[#1a1a1c] border-2 border-[#2a2a2b] rounded-lg p-6">
            <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Final Score</p>
            <p className="text-[48px] font-black font-display-lg text-white leading-none">
              {score.toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button 
              onClick={() => {
                // BUG-05 FIX: Use 'spectating' state instead of 'playing'.
                // Forcing 'playing' would render LiveQuestion without question data, causing a crash.
                // 'spectating' state renders LiveQuestion in read-only mode (no answer submission).
                useGameStore.getState().setGameState('spectating');
                navigate('/play');
              }}
              className="w-full bg-[#2a2a2b] hover:bg-[#353436] text-white border-2 border-[#4a4456] py-4 rounded-lg font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">visibility</span>
              Watch as Spectator
            </button>
            <button 
              onClick={() => {
                useGameStore.getState().reset();
                navigate('/join');
              }}
              className="w-full bg-[#1a1a1c] hover:bg-[#2a2a2b] text-gray-400 py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
