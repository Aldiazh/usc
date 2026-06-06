import { useEffect, useCallback, useRef } from 'react';
import { getEcho, disconnectEcho } from '../lib/echo';
import api from '../lib/api';
import useGameStore from '../stores/useGameStore';

/**
 * Game socket hook using Laravel Echo + Reverb.
 * Listens to broadcasts on the event channel and updates Zustand store.
 */
export default function useGameSocket() {
  const echoRef = useRef(null);
  const eventId = useGameStore((s) => s.eventId);
  const participantId = useGameStore((s) => s.participantId);

  useEffect(() => {
    if (!eventId) return;

    const echo = getEcho();
    echoRef.current = echo;

    const channel = echo.channel(`event.${eventId}`);

    // Lobby updates
    channel.listen('.lobby.updated', (data) => {
      useGameStore.getState().setLobbyParticipants(data.participants || []);
    });

    // New question broadcast — transition to playing state
    channel.listen('.game.question', (data) => {
      useGameStore.getState().setCurrentQuestion(data);
    });

    // Question ended — BUG-06 FIX:
    // Show individual feedback first (setLastFeedback → gameState: 'feedback'),
    // then scoreboard data is stored for the scoreboard screen.
    // If participant didn't answer (still in 'playing' state), treat as wrong answer.
    channel.listen('.game.feedback', (data) => {
      const store = useGameStore.getState();
      // Store the scoreboard data without changing gameState yet
      store.setScoreboardOnly(data.scoreboard || []);
      // If participant is still in playing state, they didn't answer in time — show timeout feedback
      if (store.gameState === 'playing') {
        store.setLastFeedback({ is_correct: false, points_earned: 0, total_score: store.score });
      }
      // If already in feedback state (answered), scoreboard is stored and ready
    });

    // Game ended — show final scoreboard
    channel.listen('.game.end', (data) => {
      useGameStore.getState().setScoreboard(data.finalRanking || []);
      useGameStore.getState().setGameState('ended');
    });

    // BUG-07 FIX: Listen for participant elimination event.
    // If the current participant is in the eliminated list, transition to 'eliminated' state.
    channel.listen('.participant.eliminated', (data) => {
      const currentParticipantId = useGameStore.getState().participantId;
      const eliminatedIds = data.eliminated_ids || [];
      if (currentParticipantId && eliminatedIds.includes(currentParticipantId)) {
        useGameStore.getState().setGameState('eliminated');
      }
    });

    return () => {
      channel.stopListening('.lobby.updated');
      channel.stopListening('.game.question');
      channel.stopListening('.game.feedback');
      channel.stopListening('.game.end');
      channel.stopListening('.participant.eliminated');
    };
  }, [eventId]);

  // Submit answer via REST API (not socket)
  const submitAnswer = useCallback(async (eventQuestionId, selectedOptionId, textAnswer, timeTakenMs) => {
    if (!participantId) return null;
    try {
      const res = await api.post(`/participant/${participantId}/answer`, {
        event_question_id: eventQuestionId,
        selected_option_id: selectedOptionId,
        text_answer: textAnswer,
        time_taken_ms: timeTakenMs,
      });
      useGameStore.getState().setLastFeedback(res.data);
      if (res.data.points_earned > 0) {
        useGameStore.getState().addScore(res.data.points_earned);
      }
      return res.data;
    } catch (err) {
      console.error('Answer submission failed:', err);
      return null;
    }
  }, [participantId]);

  // Join game room via REST API — only needs PIN (user data from auth token)
  const joinGameRoom = useCallback(async (pin) => {
    try {
      const res = await api.post('/participant/join', { pin });
      const participant = res.data.participant;
      useGameStore.getState().setParticipantId(participant.id);
      useGameStore.getState().setEventId(participant.event_id || participant.event?.id);
      useGameStore.getState().setGameState('lobby');
      return participant;
    } catch (err) {
      console.error('Join failed:', err);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectEcho();
  }, []);

  return { submitAnswer, joinGameRoom, disconnect };
}
