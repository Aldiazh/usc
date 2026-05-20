import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import useGameStore from '../../stores/useGameStore';
import useGameSocket from '../../hooks/useGameSocket';

export default function JoinForm() {
  const navigate = useNavigate();
  const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);
  const pin = useGameStore((state) => state.pin);
  const { joinGameRoom } = useGameSocket();

  const [formData, setFormData] = useState({
    nickname: '',
    teamname: '',
    institution: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nickname || !formData.institution) return;
    
    setIsLoading(true);
    try {
      setPlayerInfo(formData);
      await joinGameRoom(pin, formData);
      toast.success('Joined successfully!');
      navigate('/play/lobby');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join. Check your PIN.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col font-body-md text-white">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Header */}
      <header className="h-16 md:h-20 shrink-0 bg-[#0A0A0B] border-b border-[#1f2937] flex justify-between items-center px-4 md:px-8 z-20">
        <div className="text-xl md:text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-gray-400">
          <button className="hover:text-white transition-colors hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">settings</span>
          </button>
          <button onClick={() => { useGameStore.getState().reset(); navigate('/join'); }} className="hover:text-white transition-colors hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 w-full">
        <div className="w-full max-w-[500px] flex flex-col gap-8 md:gap-10">
          
          <div className="text-center flex flex-col gap-2">
            <h1 className="font-black text-[48px] md:text-[64px] font-display-lg text-[#7a33ff] tracking-wide uppercase leading-none">
              JOIN IN
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium">
              Enter your details to clash.
            </p>
            <p className="text-sm text-gray-500 font-mono mt-1">
              PIN: <span className="text-[#ffc703] font-bold tracking-widest">{pin}</span>
            </p>
          </div>

          <form 
            className="flex flex-col gap-5 md:gap-6 w-full"
            onSubmit={handleSubmit}
          >
            {/* Nickname Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-xs md:text-sm tracking-widest font-bold text-[#ffc703] uppercase">NICKNAME</label>
              <input 
                type="text" 
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full bg-[#2a2a2b] border-[3px] md:border-[4px] border-[#0a0a0b] p-4 md:p-5 text-white font-bold text-xl md:text-2xl focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b]"
                required
                disabled={isLoading}
              />
            </div>

            {/* Team Name Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-xs md:text-sm tracking-widest font-bold text-[#ffc703] uppercase">TEAM NAME (OPTIONAL)</label>
              <input 
                type="text" 
                name="teamname"
                value={formData.teamname}
                onChange={handleChange}
                className="w-full bg-[#2a2a2b] border-[3px] md:border-[4px] border-[#0a0a0b] p-4 md:p-5 text-white font-bold text-xl md:text-2xl focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b]"
                disabled={isLoading}
              />
            </div>

            {/* School/Institution Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-xs md:text-sm tracking-widest font-bold text-[#ffc703] uppercase">SCHOOL / INSTITUTION</label>
              <input 
                type="text" 
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full bg-[#2a2a2b] border-[3px] md:border-[4px] border-[#0a0a0b] p-4 md:p-5 text-white font-bold text-xl md:text-2xl focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b]"
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="mt-2 md:mt-4 w-full bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] disabled:cursor-not-allowed text-white border-[3px] md:border-[4px] border-[#0a0a0b] p-5 md:p-6 flex items-center justify-center gap-3 transition-all active:translate-y-2 active:shadow-[0_0px_0_0_#0a0a0b] shadow-[0_6px_0_0_#0a0a0b] md:shadow-[0_8px_0_0_#0a0a0b]"
            >
              {isLoading ? (
                <span className="text-2xl md:text-3xl font-black font-display-lg tracking-wider uppercase animate-pulse">JOINING...</span>
              ) : (
                <>
                  <span className="text-3xl md:text-4xl font-black font-display-lg tracking-wider uppercase">READY!</span>
                  <span className="material-symbols-outlined text-[32px] md:text-[40px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 md:py-6 flex flex-col items-center gap-2 border-t border-[#1f2937] bg-[#0A0A0B]">
        <div className="flex gap-4 md:gap-6">
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Privacy</a>
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Terms</a>
          <a href="#" className="font-label-mono text-[10px] md:text-[11px] tracking-widest text-gray-500 hover:text-white uppercase font-bold">Support</a>
        </div>
        <p className="font-label-mono text-[8px] md:text-[10px] tracking-widest text-gray-600 uppercase font-bold text-center px-4">
          © 2024 INFO-CLASH HIGH-STAKES INFORMATICS
        </p>
      </footer>
    </div>
  );
}
