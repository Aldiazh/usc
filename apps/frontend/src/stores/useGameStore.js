import { create } from 'zustand';

const useGameStore = create((set) => ({
  // Participant identity
  pin: '',
  participantId: null,
  eventId: null,
  playerInfo: null, // { nickname, institution }
  
  // Game flow state
  gameState: 'idle', // 'idle' | 'lobby' | 'countdown' | 'playing' | 'feedback' | 'scoreboard' | 'eliminated' | 'ended'
  score: 0,

  // Current question data (from broadcast)
  currentQuestion: null,
  // { event_question_id, question_text, type, options[], time_limit, index, total }
  
  // Timer
  timeRemaining: 0,

  // Feedback after answering
  lastFeedback: null,
  // { is_correct, points_earned, total_score }

  // Lobby participants
  lobbyParticipants: [],

  // Scoreboard
  scoreboard: [],

  // Actions
  setPin: (pin) => set({ pin }),
  setParticipantId: (id) => set({ participantId: id }),
  setEventId: (id) => set({ eventId: id }),
  setPlayerInfo: (info) => set({ playerInfo: info }),
  setGameState: (state) => set({ gameState: state }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  setCurrentQuestion: (question) => set({ currentQuestion: question, gameState: 'playing', lastFeedback: null }),
  setTimeRemaining: (ms) => set({ timeRemaining: ms }),
  setLastFeedback: (feedback) => set({ lastFeedback: feedback, gameState: 'feedback' }),
  setLobbyParticipants: (participants) => set({ lobbyParticipants: participants }),
  setScoreboard: (scores) => set({ scoreboard: scores, gameState: 'scoreboard' }),
  
  // Reset state (saat keluar)
  reset: () => set({
    pin: '', participantId: null, eventId: null, playerInfo: null,
    gameState: 'idle', score: 0, currentQuestion: null, timeRemaining: 0,
    lastFeedback: null, lobbyParticipants: [], scoreboard: [],
  }),
}));

export default useGameStore;
