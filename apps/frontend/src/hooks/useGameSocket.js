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

    // New question broadcast
    channel.listen('.game.question', (data) => {
      useGameStore.getState().setCurrentQuestion(data);
    });

    // Question ended / feedback
    channel.listen('.game.feedback', (data) => {
      useGameStore.getState().setScoreboard(data.scoreboard || []);
    });

    // Game ended
    channel.listen('.game.end', (data) => {
      useGameStore.getState().setScoreboard(data.finalRanking || []);
      useGameStore.getState().setGameState('ended');
    });

    return () => {
      channel.stopListening('.lobby.updated');
      channel.stopListening('.game.question');
      channel.stopListening('.game.feedback');
      channel.stopListening('.game.end');
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

  // Join game room via REST API — now only needs PIN (user data from auth token)
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
