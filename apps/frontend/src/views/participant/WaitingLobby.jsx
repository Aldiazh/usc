import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../../stores/useGameStore';
import useGameSocket from '../../hooks/useGameSocket';

export default function WaitingLobby() {
  const navigate = useNavigate();
  const { playerInfo, lobbyParticipants, gameState, pin } = useGameStore();
  useGameSocket(); // Activate Echo listener

  // Navigate to play when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      navigate('/play');
    }
  }, [gameState, navigate]);

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col font-body-md text-white">
      
      {/* Header */}
      <header className="h-16 md:h-20 shrink-0 bg-[#0A0A0B] border-b border-[#1f2937] flex justify-between items-center px-4 md:px-8 z-20">
        <div className="text-xl md:text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-widest text-[#ffc703] font-label-mono uppercase">
            PIN: {pin}
          </span>
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7a33ff] rounded-full blur-[200px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg">
          
          {/* Spinner */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2b]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7a33ff] animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#ffc703] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#7a33ff]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <h1 className="text-[32px] md:text-[48px] font-black font-display-lg tracking-wide uppercase leading-none mb-3">
              WAITING
            </h1>
            <p className="text-lg text-gray-400 font-medium">
              The host will start the game soon...
            </p>
          </div>

          {/* Player Card */}
          <div className="w-full bg-[#1a1a1c] border-2 border-[#2a2a2b] rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-[#7a33ff] flex items-center justify-center text-xl font-black">
                {playerInfo?.nickname?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold text-lg">{playerInfo?.nickname || 'Player'}</p>
                <p className="text-gray-500 text-sm font-medium">{playerInfo?.institution || ''}</p>
                {/* SMELL-05 FIX: Removed teamname reference — column dropped in migration */}
              </div>
            </div>
          </div>

          {/* Participant Count */}
          <div className="flex items-center gap-3 bg-[#1a1a1c] border border-[#2a2a2b] rounded-full px-6 py-3">
            <span className="material-symbols-outlined text-[#a5b4fc]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <span className="font-bold text-lg">
              <span className="text-white">{lobbyParticipants.length || 1}</span>
              <span className="text-gray-500 text-sm ml-1">players joined</span>
            </span>
          </div>

          {/* Participant List */}
          {lobbyParticipants.length > 0 && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {lobbyParticipants.map((p, i) => (
                <div key={p.id || i} className="bg-[#1a1a1c] border border-[#2a2a2b] rounded px-3 py-2 text-sm font-medium text-gray-300 truncate flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  {p.nickname}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
