import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { cachedGet, SHORT_CACHE_TTL } from '../lib/apiCache';

const RANKING_PER_PAGE = 50;

const podiumConfig = [
  { rank: 2, order: 'md:order-1', height: '', border: 'border-[#d0bcff]', color: 'text-[#d0bcff]', icon: 'workspace_premium', badge: null, textSize: 'text-[50px] md:text-[80px]', nameSize: 'text-xl md:text-3xl', ptSize: 'text-lg md:text-xl', shadow: 'shadow-[0_10px_30px_rgba(0,0,0,0.5)]' },
  { rank: 1, order: 'md:order-2', height: 'md:translate-y-[-40px]', border: 'border-[#ffc703]', color: 'text-[#ffc703]', icon: 'emoji_events', badge: 'CHAMPION', textSize: 'text-[60px] md:text-[100px]', nameSize: 'text-2xl md:text-4xl', ptSize: 'text-xl md:text-3xl', shadow: 'shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-10' },
  { rank: 3, order: 'md:order-3', height: '', border: 'border-[#d97706]', color: 'text-[#d97706]', icon: 'military_tech', badge: null, textSize: 'text-[50px] md:text-[80px]', nameSize: 'text-xl md:text-3xl', ptSize: 'text-lg md:text-xl', shadow: 'shadow-[0_10px_30px_rgba(0,0,0,0.5)]' },
];

const playerIcons = ['terminal', 'bug_report', 'data_object', 'memory', 'code', 'security', 'dns', 'hub'];

export default function GlobalRanking() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rankingPagination, setRankingPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await cachedGet('/admin/events', {}, SHORT_CACHE_TTL);
      const evts = res.data || [];
      setEvents(evts);
      if (evts.length > 0) {
        setSelectedEvent(evts[0].id);
        fetchRanking(evts[0].id, 1);
      } else {
        setIsLoading(false);
      }
    } catch {
      toast.error('Failed to load events');
      setIsLoading(false);
    }
  };

  const fetchRanking = async (eventId, nextPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await cachedGet(`/admin/events/${eventId}/ranking`, {
        params: { paginated: 1, page: nextPage, per_page: RANKING_PER_PAGE },
      }, SHORT_CACHE_TTL);
      const players = res.data.data || [];
      setRanking((current) => append ? [...current, ...players] : players);
      setRankingPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch {
      toast.error('Failed to load ranking');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleEventChange = (e) => {
    const id = e.target.value;
    setSelectedEvent(id);
    fetchRanking(id, 1);
  };

  const topThree = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col items-center gap-6 md:gap-10 font-body-md animate-in fade-in duration-500 pb-20 w-full">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Title */}
      <div className="relative mt-4 w-full px-4 overflow-hidden flex justify-center">
        <h1 className="text-[40px] sm:text-[60px] md:text-[80px] font-black font-display-xl tracking-wide uppercase text-[#e9ddff] leading-none text-center whitespace-nowrap" 
            style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 8px 8px 0 rgba(0,0,0,0.5)' }}>
          GLOBAL RANKING
        </h1>
      </div>

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="w-full max-w-sm">
          <select 
            value={selectedEvent || ''} 
            onChange={handleEventChange}
            className="w-full bg-[#1a1a1c] border-2 border-[#2a2a2b] text-white rounded-lg px-4 py-3 font-bold text-sm tracking-wide focus:outline-none focus:border-[#7a33ff] transition-colors cursor-pointer"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title} ({ev.status})</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-12 h-12 border-4 border-[#7a33ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold">Loading rankings...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <span className="material-symbols-outlined text-[64px] mb-4 block">leaderboard</span>
          <p className="font-bold text-xl">No rankings yet</p>
          <p className="text-sm mt-2">Rankings will appear after participants score points</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 w-full max-w-4xl mt-8 md:mt-16">
            {podiumConfig.map((cfg) => {
              const player = topThree[cfg.rank - 1];
              if (!player) return null;
              return (
                <div key={cfg.rank} className={`w-[90%] sm:w-72 ${cfg.order} bg-[#2a2a2b] rounded-xl md:rounded-b-none md:rounded-t-xl flex flex-col items-center pt-8 pb-6 border-b-8 ${cfg.border} relative ${cfg.shadow} ${cfg.height}`}>
                  {cfg.badge && (
                    <div className="absolute -top-4 bg-[#ffc703] text-black text-[10px] md:text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg">
                      {cfg.badge}
                    </div>
                  )}
                  <span className={`material-symbols-outlined text-5xl md:text-6xl ${cfg.color} mb-2`} style={{ fontVariationSettings: "'FILL' 0" }}>{cfg.icon}</span>
                  <div className={`${cfg.textSize} font-black font-display-lg leading-none ${cfg.color} mb-4 md:mb-6 drop-shadow-lg`}>{cfg.rank}</div>
                  <h3 className={`${cfg.nameSize} font-bold font-display-lg text-white mb-4 text-center px-4`}>{player.nickname}</h3>
                  <div className={`bg-[#1a1a1c] w-11/12 py-2 md:py-3 text-center rounded ${cfg.rank === 1 ? 'border border-[#3e2e00]' : ''}`}>
                    <span className={`${cfg.ptSize} font-bold tracking-widest ${cfg.color}`}>{(player.total_score ?? 0).toLocaleString()} PTS</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List Rankings */}
          {rest.length > 0 && (
            <div className="w-full max-w-4xl mt-8">
              <div className="flex px-4 md:px-8 pb-4 text-[10px] md:text-xs font-bold tracking-widest text-gray-500 uppercase">
                <div className="w-12 md:w-24 text-center">RANK</div>
                <div className="flex-1 pl-2 md:pl-4">HACKER ALIAS</div>
                <div className="w-20 md:w-32 text-right">SCORE</div>
              </div>
              
              <div className="flex flex-col gap-2 md:gap-3">
                {rest.map((player, i) => (
                  <div key={player.id} className="flex items-center px-4 md:px-8 py-3 md:py-5 bg-[#1a1a1c] rounded-lg border border-[#2a2a2b] hover:border-[#4a4456] transition-colors">
                    <div className="w-12 md:w-24 text-center text-2xl md:text-4xl font-black font-display-lg text-[#353436]">{player.current_rank ?? i + 4}</div>
                    <div className="flex-1 pl-2 md:pl-4 flex items-center gap-2 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#2a2a2b] flex items-center justify-center text-gray-400 shrink-0">
                        <span className="material-symbols-outlined text-[16px] md:text-[20px]">{playerIcons[i % playerIcons.length]}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-base md:text-xl font-bold font-display-lg text-gray-300 truncate block">{player.nickname}</span>
                        {player.institution && (
                          <span className="text-xs text-gray-600 truncate block">{player.institution}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 md:w-32 text-right text-base md:text-xl font-bold tracking-widest text-gray-400">
                      {(player.total_score ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              {rankingPagination && rankingPagination.current_page < rankingPagination.last_page && (
                <div className="flex justify-center mt-5">
                  <button
                    type="button"
                    onClick={() => fetchRanking(selectedEvent, rankingPagination.current_page + 1, true)}
                    disabled={isLoadingMore}
                    className="border border-[#353436] hover:border-[#7a33ff] bg-[#1a1a1c] hover:bg-[#2a2a2b] disabled:opacity-50 text-gray-300 hover:text-white rounded px-5 py-3 text-sm font-bold tracking-wider transition-colors"
                  >
                    {isLoadingMore ? 'LOADING...' : 'LOAD MORE RANKINGS'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
