// SMELL-02 FIX: Static imports moved to top, before lazy imports
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import useGameStore from './stores/useGameStore';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import ParticipantGuard from './components/ParticipantGuard';
import ErrorBoundary from './components/ErrorBoundary';
import { routeLoaders } from './lib/routePrefetch';

const AdminLogin = React.lazy(routeLoaders.adminLogin);
const Dashboard = React.lazy(routeLoaders.dashboard);
const QuestionBank = React.lazy(routeLoaders.questions);
const GlobalRanking = React.lazy(routeLoaders.ranking);
const GameControl = React.lazy(routeLoaders.gameControl);
const UserManagement = React.lazy(routeLoaders.users);
const ParticipantLogin = React.lazy(routeLoaders.participantLogin);
const EnterPin = React.lazy(routeLoaders.enterPin);
const LiveQuestion = React.lazy(routeLoaders.liveQuestion);
const Feedback = React.lazy(routeLoaders.feedback);
const WaitingLobby = React.lazy(routeLoaders.waitingLobby);
const Eliminated = React.lazy(routeLoaders.eliminated);

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#131314] flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-[#7a33ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function LazyPage({ children }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}

// BUG-05 FIX: Added 'spectating' state that renders LiveQuestion in read-only mode.
// BUG-07 FIX: Added 'eliminated' state redirect handled by useGameSocket listener.
function PlayView({ gameState }) {
  if (gameState === 'playing') return <LiveQuestion />;
  if (gameState === 'feedback') return <Feedback />;
  if (gameState === 'lobby') return <Navigate to="/play/lobby" replace />;
  if (gameState === 'eliminated') return <Navigate to="/play/eliminated" replace />;
  // Spectator mode: show LiveQuestion in read-only (no answer submission).
  // LiveQuestion handles spectatorMode via isSubmitted=true by default when no question yet.
  if (gameState === 'spectating') return <LiveQuestion />;

  return (
    <div className="min-h-screen bg-[#131314] flex items-center justify-center flex-col gap-4">
      <div className="w-16 h-16 border-4 border-[#7a33ff] border-t-transparent rounded-full animate-spin" />
      <h1 className="text-white text-2xl font-bold animate-pulse font-display-lg tracking-wide">WAITING FOR HOST...</h1>
      <p className="text-gray-500 text-sm">The game will start soon</p>
    </div>
  );
}

export default function App() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <ErrorBoundary>
      <Toaster theme="dark" />
      <div className="relative min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LazyPage><ParticipantLogin /></LazyPage>} />

          <Route path="/join" element={
            <ParticipantGuard>
              <LazyPage><EnterPin /></LazyPage>
            </ParticipantGuard>
          } />
          <Route path="/play/lobby" element={
            <ParticipantGuard>
              <LazyPage><WaitingLobby /></LazyPage>
            </ParticipantGuard>
          } />
          <Route path="/play/eliminated" element={
            <ParticipantGuard>
              <LazyPage><Eliminated /></LazyPage>
            </ParticipantGuard>
          } />
          <Route path="/play" element={
            <ParticipantGuard>
              <LazyPage><PlayView gameState={gameState} /></LazyPage>
            </ParticipantGuard>
          } />

          <Route path="/admin/login" element={<LazyPage><AdminLogin /></LazyPage>} />
          <Route path="/admin" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<LazyPage><Dashboard /></LazyPage>} />
            <Route path="questions" element={<LazyPage><QuestionBank /></LazyPage>} />
            <Route path="users" element={<LazyPage><UserManagement /></LazyPage>} />
            <Route path="ranking" element={<LazyPage><GlobalRanking /></LazyPage>} />
            <Route path="events/:eventId" element={<LazyPage><GameControl /></LazyPage>} />
            <Route path="analytics" element={<div className="p-8 text-gray-400">Analytics Dashboard coming soon...</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
