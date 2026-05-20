import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import api from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async () => {
    const title = prompt('Event title:');
    if (!title) return;
    try {
      const res = await api.post('/admin/events', { title });
      toast.success(`Event created! PIN: ${res.data.pin}`);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to create event');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'live': return { bg: 'bg-[#450a0a]', border: 'border-[#7f1d1d]', text: 'text-[#fca5a5]', icon: 'sensors', label: 'Live Now' };
      case 'lobby': return { bg: 'bg-[#1c1917]', border: 'border-[#854d0e]', text: 'text-[#fcd34d]', icon: 'hourglass_top', label: 'In Lobby' };
      case 'paused': return { bg: 'bg-[#1c1917]', border: 'border-[#854d0e]', text: 'text-[#fb923c]', icon: 'pause_circle', label: 'Paused' };
      case 'finished': return { bg: 'bg-[#1a1a1c]', border: 'border-[#4a4456]', text: 'text-gray-400', icon: 'check_circle', label: 'Finished' };
      default: return { bg: 'bg-[#2a2a2b]', border: 'border-[#4a4456]', text: 'text-gray-400', icon: 'schedule', label: 'Draft' };
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8 md:gap-10 font-body-md animate-pulse">
        <div className="h-16 bg-[#1a1a1c] rounded w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-[#1a1a1c] rounded border-2 border-[#2a2a2b]" />)}
        </div>
        <div className="h-32 bg-[#1a1a1c] rounded border-2 border-[#2a2a2b]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8 md:gap-10 font-body-md animate-in fade-in duration-500">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[40px] md:text-[56px] font-black font-display-lg leading-tight tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mt-2 font-medium">
            Manage your high-stakes events and question repositories.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/admin/questions')}
            className="w-full sm:w-auto bg-[#1a1a1c] hover:bg-[#2a2a2b] border border-[#353436] hover:border-[#4a4456] text-white px-6 py-4 rounded font-bold text-lg md:text-xl tracking-wide flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-sm group"
          >
            <span className="material-symbols-outlined text-[#ffc703] group-hover:-translate-y-1 transition-transform">upload_file</span>
            Import Bank
          </button>
          <button 
            onClick={createEvent}
            className="w-full sm:w-auto bg-[#7a33ff] hover:bg-[#6a1ceb] text-white px-6 py-4 rounded font-bold text-lg md:text-xl tracking-wide flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-[0_4px_14px_0_rgba(122,51,255,0.39)]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Card 1 */}
        <div className="border-2 border-[#2a2a2b] bg-[#1a1a1c] p-6 rounded relative overflow-hidden group hover:border-[#4a4456] transition-colors">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <h3 className="text-[#a5b4fc] text-sm font-bold tracking-widest uppercase mb-4">Active Events</h3>
            <div className="text-[64px] md:text-[80px] font-black font-display-lg leading-none mb-4">{stats?.active_events ?? 0}</div>
            <p className="text-gray-400 text-sm font-medium">Currently running sessions</p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 top-1/2 -translate-y-1/2 text-[120px] md:text-[140px] text-white opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
        </div>

        {/* Card 2 */}
        <div className="border-2 border-[#2a2a2b] bg-[#1a1a1c] p-6 rounded relative overflow-hidden group hover:border-[#4a4456] transition-colors">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <h3 className="text-[#fcd34d] text-sm font-bold tracking-widest uppercase mb-4">Question Bank</h3>
            <div className="text-[64px] md:text-[80px] font-black font-display-lg leading-none mb-4">{stats?.total_questions ?? 0}</div>
            <p className="text-gray-400 text-sm font-medium">Total verified questions</p>
          </div>
          <span className="material-symbols-outlined absolute -right-2 top-1/2 -translate-y-1/2 text-[120px] md:text-[140px] text-white opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ fontVariationSettings: "'FILL' 0" }}>
            quiz
          </span>
        </div>

        {/* Card 3 */}
        <div className="border-2 border-[#2a2a2b] bg-[#1a1a1c] p-6 rounded relative overflow-hidden group hover:border-[#4a4456] transition-colors">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <h3 className="text-[#fb923c] text-sm font-bold tracking-widest uppercase mb-4">Total Participants</h3>
            <div className="text-[64px] md:text-[80px] font-black font-display-lg leading-none mb-4">{stats?.total_participants ?? 0}</div>
            <p className="text-gray-400 text-sm font-medium">Across all events</p>
          </div>
          <span className="material-symbols-outlined absolute -right-6 top-1/2 -translate-y-1/2 text-[120px] md:text-[140px] text-white opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
            groups
          </span>
        </div>
      </div>

      {/* Live & Upcoming Events */}
      <div className="mt-2 md:mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[24px] md:text-[28px] font-bold font-display-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Events List
          </h2>
        </div>
        
        <div className="border-t-2 border-[#2a2a2b] pt-6 flex flex-col gap-4">
          {stats?.events?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-[48px] mb-4 block">event_busy</span>
              <p className="font-bold">No events yet. Create your first event!</p>
            </div>
          )}
          
          {stats?.events?.map((event) => {
            const cfg = getStatusConfig(event.status);
            return (
              <div key={event.id} className="border-2 border-[#2a2a2b] bg-[#1a1a1c] p-4 md:p-5 rounded flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#4a4456] transition-colors">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.text}`}>
                    <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold font-display-lg tracking-wide mb-1">{event.title}</h3>
                    <p className={`${cfg.text} text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center gap-2`}>
                      {event.status === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      {cfg.label} • PIN: {event.pin} • {event.participants_count ?? 0} Players
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/admin/events/${event.id}`)}
                  className="w-full md:w-auto bg-[#2a2a2b] hover:bg-[#353436] text-white px-6 py-3 rounded text-sm font-bold tracking-wider transition-colors border border-[#4a4456]"
                >
                  MANAGE
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
