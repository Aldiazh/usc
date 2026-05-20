import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import api from '../../lib/api';
import { getEcho } from '../../lib/echo';

export default function GameControl() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // track which button is loading

  // Fetch initial data
  useEffect(() => {
    fetchEventData();
    const interval = setInterval(fetchLiveStats, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Listen for lobby updates
  useEffect(() => {
    if (!eventId) return;
    const echo = getEcho();
    const channel = echo.channel(`event.${eventId}`);
    channel.listen('.lobby.updated', (data) => {
      setParticipants(data.participants || []);
    });
    return () => {
      channel.stopListening('.lobby.updated');
    };
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const [eventRes, participantsRes] = await Promise.all([
        api.get(`/admin/events/${eventId}`),
        api.get(`/admin/events/${eventId}/participants`),
      ]);
      setEvent(eventRes.data);
      setParticipants(participantsRes.data);
    } catch (err) {
      toast.error('Failed to load event data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await api.get(`/admin/events/${eventId}/live-stats`);
      setStats(res.data);
    } catch { /* silent fail for polling */ }
  }, [eventId]);

  const handleAction = async (action, label) => {
    setActionLoading(action);
    try {
      const endpoints = {
        start: { method: 'post', url: `/admin/events/${eventId}/start` },
        next: { method: 'post', url: `/admin/events/${eventId}/next-question` },
        endQuestion: { method: 'post', url: `/admin/events/${eventId}/end-question` },
        end: { method: 'post', url: `/admin/events/${eventId}/end` },
      };
      const ep = endpoints[action];
      const res = await api[ep.method](ep.url);
      toast.success(res.data.message || `${label} successful`);
      fetchEventData();
      fetchLiveStats();
    } catch (err) {
      toast.error(err.response?.data?.message || `${label} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEliminate = async () => {
    const count = prompt('Keep top N players (eliminate the rest):');
    if (!count || isNaN(count)) return;
    setActionLoading('eliminate');
    try {
      const res = await api.post(`/admin/events/${eventId}/eliminate`, {
        survival_count: parseInt(count),
      });
      toast.success(res.data.message);
      fetchEventData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Elimination failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse">
        <div className="h-12 bg-[#1a1a1c] rounded w-1/3 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[#1a1a1c] rounded border border-[#2a2a2b]" />)}
        </div>
        <div className="h-64 bg-[#1a1a1c] rounded border border-[#2a2a2b]" />
      </div>
    );
  }

  const isLive = event?.status === 'live';
  const isLobby = event?.status === 'lobby' || event?.status === 'draft';
  const isFinished = event?.status === 'finished';
  const onlinePlayers = participants.filter(p => p.is_online).length;
  const totalPlayers = participants.length;
  const activePlayers = participants.filter(p => p.status !== 'eliminated').length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-6 font-body-md animate-in fade-in duration-500">
      <Toaster position="top-center" theme="dark" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin')} className="text-xs font-bold tracking-widest text-gray-500 hover:text-white uppercase transition-colors mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="text-[32px] md:text-[48px] font-black font-display-lg leading-tight tracking-tight">
            {event?.title || 'Game Control'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
              isLive ? 'bg-red-900/30 border-red-700/50 text-red-400' :
              isLobby ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400' :
              isFinished ? 'bg-green-900/30 border-green-700/50 text-green-400' :
              'bg-[#2a2a2b] border-[#4a4456] text-gray-400'
            }`}>
              {isLive && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />}
              {event?.status?.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 font-bold font-mono">PIN: {event?.pin}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {(isLobby) && (
            <button 
              onClick={() => handleAction('start', 'Start Game')}
              disabled={actionLoading === 'start'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white px-6 py-3 rounded font-bold tracking-wider flex items-center gap-2 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              {actionLoading === 'start' ? 'Starting...' : 'Start Game'}
            </button>
          )}
          {isLive && (
            <>
              <button 
                onClick={() => handleAction('next', 'Next Question')}
                disabled={!!actionLoading}
                className="bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] text-white px-5 py-3 rounded font-bold tracking-wider flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">skip_next</span>
                {actionLoading === 'next' ? '...' : 'Next'}
              </button>
              <button 
                onClick={() => handleAction('endQuestion', 'End Question')}
                disabled={!!actionLoading}
                className="bg-[#2a2a2b] hover:bg-[#353436] text-white px-5 py-3 rounded font-bold tracking-wider flex items-center gap-2 transition-colors border border-[#4a4456]"
              >
                <span className="material-symbols-outlined">timer_off</span>
                End Q
              </button>
              <button 
                onClick={handleEliminate}
                disabled={!!actionLoading}
                className="bg-orange-700 hover:bg-orange-800 text-white px-5 py-3 rounded font-bold tracking-wider flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">person_remove</span>
                Eliminate
              </button>
              <button 
                onClick={() => {
                  if (confirm('End the game? This cannot be undone.')) {
                    handleAction('end', 'End Game');
                  }
                }}
                disabled={!!actionLoading}
                className="bg-red-700 hover:bg-red-800 text-white px-5 py-3 rounded font-bold tracking-wider flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">stop_circle</span>
                End
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Players" 
          value={totalPlayers} 
          icon="groups" 
          color="text-[#a5b4fc]" 
        />
        <StatCard 
          label="Online Now" 
          value={onlinePlayers} 
          icon="wifi" 
          color="text-green-400"
          suffix={<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block ml-2" />} 
        />
        <StatCard 
          label="Active Players" 
          value={activePlayers} 
          icon="person" 
          color="text-[#ffc703]" 
        />
        <StatCard 
          label="Answered" 
          value={stats?.answered_count ?? 0} 
          icon="check_circle"
          color="text-[#fb923c]"
          subtext={stats ? `${stats.answered_count}/${stats.total_participants}` : '...'}
        />
      </div>

      {/* Question Progress */}
      {stats && (
        <div className="border border-[#2a2a2b] bg-[#1a1a1c] rounded-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Question Progress</h3>
            <span className="text-sm font-bold text-white">
              {(stats.current_question_index ?? 0) + 1} / {stats.total_questions ?? 0}
            </span>
          </div>
          <div className="w-full h-3 bg-[#2a2a2b] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#7a33ff] to-[#a855f7] rounded-full transition-all duration-500"
              style={{ width: stats.total_questions ? `${(((stats.current_question_index ?? 0) + 1) / stats.total_questions) * 100}%` : '0%' }}
            />
          </div>
          {stats.avg_time_ms > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Avg response time: <span className="text-white font-bold">{(stats.avg_time_ms / 1000).toFixed(1)}s</span>
            </p>
          )}
        </div>
      )}

      {/* Participants List */}
      <div>
        <h2 className="text-lg font-bold font-display-lg tracking-wide mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          Participants ({totalPlayers})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {participants.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-[48px] mb-3 block">group_add</span>
              <p className="font-bold">No participants yet</p>
              <p className="text-sm mt-1">Share the PIN: <span className="text-[#ffc703] font-mono font-bold">{event?.pin}</span></p>
            </div>
          ) : (
            participants.map((p) => (
              <div key={p.id} className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
                p.status === 'eliminated' 
                  ? 'border-red-900/50 bg-red-900/10 opacity-60' 
                  : 'border-[#2a2a2b] bg-[#1a1a1c] hover:border-[#4a4456]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${p.is_online ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <div>
                    <p className="font-bold text-sm">{p.nickname}</p>
                    <p className="text-xs text-gray-500">{p.institution}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-[#ffc703]">{(p.total_score ?? 0).toLocaleString()}</p>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${
                    p.status === 'eliminated' ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {p.status === 'eliminated' ? 'ELIMINATED' : p.role?.toUpperCase() || 'PLAYER'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, subtext, suffix }) {
  return (
    <div className="border border-[#2a2a2b] bg-[#1a1a1c] rounded-lg p-4 relative overflow-hidden group hover:border-[#4a4456] transition-colors">
      <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">{label}</p>
      <div className="flex items-end gap-1">
        <p className={`text-[36px] md:text-[48px] font-black font-display-lg leading-none ${color}`}>
          {value}
        </p>
        {suffix}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1 font-bold">{subtext}</p>}
      <span className={`material-symbols-outlined absolute -right-2 -bottom-2 text-[60px] text-white opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
  );
}
