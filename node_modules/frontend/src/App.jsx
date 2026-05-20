import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import ErrorBoundary from './components/ErrorBoundary';

// Admin Views
import AdminLogin from './views/AdminLogin';
import Dashboard from './views/Dashboard';
import QuestionBank from './views/QuestionBank';
import GlobalRanking from './views/GlobalRanking';
import GameControl from './views/admin/GameControl';

// Participant Views
import EnterPin from './views/participant/EnterPin';
import JoinForm from './views/participant/JoinForm';
import LiveQuestion from './views/participant/LiveQuestion';
import Feedback from './views/participant/Feedback';
import WaitingLobby from './views/participant/WaitingLobby';
import Eliminated from './views/participant/Eliminated';

// Zustand Store
import useGameStore from './stores/useGameStore';

import { getEcho } from './lib/echo';
import { Toaster, toast } from 'sonner';

export default function App() {
  const gameState = useGameStore((state) => state.gameState);

  // Setup WebSocket connection for global testing
  React.useEffect(() => {
    const echo = getEcho();

    // Listen to test-channel
    const channel = echo.channel('test-channel');
    channel.listen('.App\\Events\\PingEvent', (e) => {
      console.log('Echo received PingEvent:', e);
      toast.success(e.message, {
        duration: 5000,
        position: 'top-right',
      });
    });

    // Cleanup listener on unmount
    return () => {
      echo.leaveChannel('test-channel');
    };
  }, []);

  return (
    <ErrorBoundary>
      <Toaster theme="dark" />
      <div className="relative min-h-screen">
        <Routes>
          {/* --- Root Redirect --- */}
          <Route path="/" element={<Navigate to="/join" replace />} />

          {/* --- Participant Flow --- */}
          <Route path="/join" element={<EnterPin />} />
          <Route path="/join/form" element={<JoinForm />} />
          <Route path="/play/lobby" element={<WaitingLobby />} />
          <Route path="/play/eliminated" element={<Eliminated />} />
          
          {/* Play route renders view based on gameState */}
          <Route path="/play" element={
            gameState === 'playing' ? <LiveQuestion /> :
            gameState === 'feedback' ? <Feedback /> :
            gameState === 'lobby' ? <Navigate to="/play/lobby" replace /> :
            gameState === 'eliminated' ? <Navigate to="/play/eliminated" replace /> :
            <div className="min-h-screen bg-[#131314] flex items-center justify-center flex-col gap-4">
              <div className="w-16 h-16 border-4 border-[#7a33ff] border-t-transparent rounded-full animate-spin" />
              <h1 className="text-white text-2xl font-bold animate-pulse font-display-lg tracking-wide">WAITING FOR HOST...</h1>
              <p className="text-gray-500 text-sm">The game will start soon</p>
            </div>
          } />

          {/* --- Admin Flow (Protected) --- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<Dashboard />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="ranking" element={<GlobalRanking />} />
            <Route path="events/:eventId" element={<GameControl />} />
            <Route path="analytics" element={<div className="p-8 text-gray-400">Analytics Dashboard coming soon...</div>} />
          </Route>

          {/* --- Fallback --- */}
          <Route path="*" element={<Navigate to="/join" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
