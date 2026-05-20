import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const navItems = [
    { id: '', path: '/admin', label: 'Dashboard', icon: 'grid_view' },
    { id: 'questions', path: '/admin/questions', label: 'Question Bank', icon: 'help_center' },
    { id: 'ranking', path: '/admin/ranking', label: 'Global Ranking', icon: 'play_circle' },
    { id: 'analytics', path: '/admin/analytics', label: 'Analytics', icon: 'bar_chart' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-[#131314] text-white font-body-md overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#121826] border-r border-[#1f2937] flex flex-col shrink-0 z-40 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 h-24 flex flex-col justify-center border-b border-[#1f2937]">
          <h1 className="text-xl font-bold font-display-lg text-white tracking-wide">Admin Panel</h1>
          <p className="text-xs text-[#FFC703] opacity-80 tracking-widest mt-1 font-label-mono uppercase">
            {user?.name || 'Host Mode'}
          </p>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
                  isActive 
                    ? 'bg-[#7a33ff] text-white' 
                    : 'text-gray-400 hover:bg-[#1f2937] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Sidebar footer */}
        <div className="p-4 border-t border-[#1f2937]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-[#1f2937] rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-bold text-sm tracking-wide">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-20 md:h-24 shrink-0 bg-[#0A0A0A] border-b border-[#1f2937] flex justify-between items-center px-4 md:px-8 relative z-20 shadow-md">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-gray-400 hover:text-white p-2 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
            <div className="text-2xl md:text-3xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
              INFO-CLASH
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-gray-400">
            <button className="hover:text-white transition-colors hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
            <button onClick={handleLogout} className="hover:text-red-400 transition-colors hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </button>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-[#131314] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
