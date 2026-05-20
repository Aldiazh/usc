import React from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../../stores/useGameStore';

export default function Feedback() {
  const navigate = useNavigate();
  const { lastFeedback, score, playerInfo, gameState } = useGameStore();

  const isCorrect = lastFeedback?.is_correct ?? false;
  const pointsEarned = lastFeedback?.points_earned ?? 0;

  // Dynamic styling based on result
  const config = isCorrect 
    ? { bg: 'bg-[#0e4f1e]', glow: 'bg-green-500', icon: 'check_circle', title: 'CORRECT!', titleColor: 'text-green-400', subtitle: 'Great job, keep going!' }
    : { bg: 'bg-[#4a0d0d]', glow: 'bg-red-500', icon: 'cancel', title: 'WRONG!', titleColor: 'text-red-400', subtitle: 'Better luck on the next one!' };

  return (
    <div className={`min-h-screen ${config.bg} flex flex-col font-body-md text-white transition-colors duration-500`}>
      
      {/* Header */}
      <header className="h-14 md:h-16 shrink-0 bg-black/30 flex justify-between items-center px-4 md:px-8 z-20">
        <div className="text-xl md:text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
        <div className="bg-black/30 px-4 py-1 rounded text-white font-bold text-sm tracking-widest border border-white/10">
          SCORE: {score.toLocaleString()}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* Background glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] ${config.glow} rounded-full blur-[200px] opacity-20 pointer-events-none`} />

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md text-center">
          
          {/* Result Icon */}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'} border-4 ${isCorrect ? 'border-green-500/50' : 'border-red-500/50'}`}>
            <span className={`material-symbols-outlined text-[64px] ${config.titleColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {config.icon}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className={`text-[48px] md:text-[64px] font-black font-display-lg tracking-wide uppercase leading-none mb-2 ${config.titleColor}`}>
              {config.title}
            </h1>
            <p className="text-lg text-white/70 font-medium">
              {config.subtitle}
            </p>
          </div>

          {/* Points Card */}
          <div className="w-full bg-black/20 border-2 border-white/10 rounded-xl p-6">
            <p className="text-xs font-bold tracking-widest text-white/50 uppercase mb-2">Points Earned</p>
            <p className={`text-[56px] font-black font-display-lg leading-none ${config.titleColor}`}>
              +{pointsEarned.toLocaleString()}
            </p>
          </div>

          {/* Player info */}
          <div className="flex items-center gap-3 bg-black/20 rounded-full px-5 py-3 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#7a33ff] flex items-center justify-center text-sm font-bold">
              {playerInfo?.nickname?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="font-bold">{playerInfo?.nickname || 'Player'}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/60 font-bold">{score.toLocaleString()} pts</span>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center gap-2 text-white/40 mt-4">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm font-medium ml-1">Waiting for next question</span>
          </div>
        </div>
      </main>
    </div>
  );
}
