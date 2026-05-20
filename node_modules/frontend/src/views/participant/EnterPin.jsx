import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../../stores/useGameStore';

export default function EnterPin() {
  const [pinValue, setPinValue] = useState('');
  const navigate = useNavigate();
  const setPin = useGameStore((state) => state.setPin);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pinValue.trim().length > 0) {
      setPin(pinValue);
      navigate('/join/form');
    }
  };

  return (
    <div className="min-h-screen bg-[#1b1b1e] flex flex-col items-center justify-between font-body-md relative overflow-hidden">
      {/* Background Graphic elements to match the image's sleek diagonal look */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(160deg, #1f2023 0%, #17181a 50%, #121315 100%)'
      }}>
        <div className="absolute top-1/2 left-0 w-[200%] h-1 bg-[#111] -rotate-12 -translate-y-[100px] md:-translate-y-[200px] -translate-x-[20%]" />
        <div className="absolute top-1/2 left-0 w-[200%] h-1 bg-[#111] -rotate-12 translate-y-[100px] md:translate-y-[150px] -translate-x-[20%]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 sm:px-6">
        
        {/* Bolt Logo */}
        <div className="bg-[#1f1f21] border-[4px] md:border-[6px] border-[#0a0a0b] rounded-xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-[0_6px_0_0_#0a0a0b] md:shadow-[0_8px_0_0_#0a0a0b] mb-8 md:mb-10">
          <span className="material-symbols-outlined text-[48px] md:text-[60px] text-[#7a33ff]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </div>

        {/* Headings */}
        <h1 className="text-[40px] md:text-[64px] font-black font-display-lg text-white tracking-wide uppercase leading-none mb-3 text-center">
          ENTER PIN
        </h1>
        <p className="text-lg md:text-xl text-gray-300 font-medium mb-8 md:mb-10 text-center">
          Join the live session to compete.
        </p>

        {/* PIN Input Form */}
        <form 
          className="w-full max-w-lg flex flex-col gap-4 md:gap-6"
          onSubmit={handleSubmit}
        >
          <input 
            type="text" 
            placeholder="0 0 0 0 0 0" 
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            className="w-full bg-[#353436] border-[4px] md:border-[6px] border-[#0a0a0b] rounded-lg p-4 md:p-6 text-center text-[40px] md:text-[56px] font-black text-white tracking-[8px] md:tracking-[16px] placeholder:text-[#4a4456] focus:border-[#7a33ff] focus:outline-none focus:ring-0 transition-colors shadow-[0_6px_0_0_#0a0a0b] md:shadow-[0_8px_0_0_#0a0a0b]"
            maxLength={6}
          />
          <button 
            type="submit"
            className="w-full bg-[#7a33ff] hover:bg-[#6a1ceb] text-white border-[4px] md:border-[6px] border-[#0a0a0b] rounded-lg p-4 md:p-6 flex items-center justify-center gap-3 md:gap-4 transition-all active:translate-y-2 active:shadow-[0_0px_0_0_#0a0a0b] shadow-[0_6px_0_0_#0a0a0b] md:shadow-[0_8px_0_0_#0a0a0b]"
          >
            <span className="text-[32px] md:text-[40px] font-black font-display-lg tracking-wider uppercase">JOIN</span>
            <span className="material-symbols-outlined text-[36px] md:text-[48px] font-bold">arrow_forward</span>
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 md:py-6 flex flex-col items-center gap-2 relative z-10 border-t-2 border-[#1a1a1c] bg-[#0a0a0b]/50">
        <div className="flex gap-4 md:gap-6">
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Privacy</a>
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Terms</a>
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Support</a>
        </div>
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="font-label-mono text-[8px] md:text-[10px] tracking-widest text-gray-600 uppercase font-bold text-center px-4">
            © 2024 INFO-CLASH HIGH-STAKES INFORMATICS
          </p>
          <button 
            onClick={() => navigate('/admin/login')}
            className="font-label-mono text-[8px] md:text-[10px] tracking-widest text-[#4a4456] hover:text-[#7a33ff] uppercase font-bold mt-1 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px]">admin_panel_settings</span>
            Host Login
          </button>
        </div>
      </footer>
    </div>
  );
}
