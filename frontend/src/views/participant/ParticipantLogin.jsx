import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import useParticipantAuthStore from '../../stores/useParticipantAuthStore';

export default function ParticipantLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useParticipantAuthStore();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(credentials.username, credentials.password);
    if (success) {
      toast.success('Login berhasil!');
      navigate('/join');
    } else {
      toast.error(useParticipantAuthStore.getState().error || 'Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-[#1b1b1e] flex flex-col items-center justify-between font-body-md relative overflow-hidden">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(160deg, #1f2023 0%, #17181a 50%, #121315 100%)'
      }}>
        <div className="absolute top-1/2 left-0 w-[200%] h-1 bg-[#111] -rotate-12 -translate-y-[100px] md:-translate-y-[200px] -translate-x-[20%]" />
        <div className="absolute top-1/2 left-0 w-[200%] h-1 bg-[#111] -rotate-12 translate-y-[100px] md:translate-y-[150px] -translate-x-[20%]" />
      </div>

      {/* Glow Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#7a33ff] rounded-full blur-[180px] opacity-[0.07] pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 sm:px-6">
        
        {/* Bolt Logo */}
        <div className="bg-[#1f1f21] border-[4px] md:border-[6px] border-[#0a0a0b] rounded-xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-[0_6px_0_0_#0a0a0b] md:shadow-[0_8px_0_0_#0a0a0b] mb-6 md:mb-8">
          <span className="material-symbols-outlined text-[48px] md:text-[60px] text-[#7a33ff]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </div>

        {/* Headings */}
        <h1 className="text-[36px] md:text-[56px] font-black font-display-lg text-white tracking-wide uppercase leading-none mb-2 text-center">
          PARTICIPANT
        </h1>
        <h2 className="text-[24px] md:text-[36px] font-black font-display-lg text-[#7a33ff] tracking-wide uppercase leading-none mb-3 text-center">
          LOGIN
        </h2>
        <p className="text-base md:text-lg text-gray-400 font-medium mb-8 md:mb-10 text-center max-w-sm">
          Masuk dengan akun yang telah diberikan oleh admin.
        </p>

        {/* Login Form */}
        <form 
          className="w-full max-w-md flex flex-col gap-4 md:gap-5"
          onSubmit={handleLogin}
        >
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-mono text-[10px] md:text-xs tracking-widest font-bold text-gray-500 uppercase">USERNAME</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">person</span>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="username"
                className="w-full bg-[#2a2a2b] border-[3px] md:border-[4px] border-[#0a0a0b] rounded-lg pl-12 pr-4 py-4 md:py-5 text-white font-bold text-base md:text-lg focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b] placeholder:text-[#4a4456]"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-mono text-[10px] md:text-xs tracking-widest font-bold text-gray-500 uppercase">PASSWORD</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-[#2a2a2b] border-[3px] md:border-[4px] border-[#0a0a0b] rounded-lg pl-12 pr-12 py-4 md:py-5 text-white font-bold text-base md:text-lg focus:border-[#7a33ff] focus:outline-none transition-colors shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b] placeholder:text-[#4a4456]"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] text-white border-[3px] md:border-[4px] border-[#0a0a0b] rounded-lg p-4 md:p-5 flex items-center justify-center gap-3 md:gap-4 transition-all active:translate-y-1 active:shadow-[0_0px_0_0_#0a0a0b] shadow-[0_4px_0_0_#0a0a0b] md:shadow-[0_6px_0_0_#0a0a0b]"
          >
            {isLoading ? (
              <span className="text-xl md:text-2xl font-black font-display-lg tracking-wider uppercase animate-pulse">LOGGING IN...</span>
            ) : (
              <>
                <span className="text-xl md:text-2xl font-black font-display-lg tracking-wider uppercase">MASUK</span>
                <span className="material-symbols-outlined text-[28px] md:text-[36px] font-bold">arrow_forward</span>
              </>
            )}
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
