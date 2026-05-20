import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import useAuthStore from '../stores/useAuthStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(credentials.email, credentials.password);
    if (success) {
      toast.success('Login successful!');
      navigate('/admin');
    } else {
      toast.error(useAuthStore.getState().error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col font-body-md text-white">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Header Minimalis */}
      <header className="h-20 shrink-0 border-b border-[#1f2937] flex justify-center items-center px-8 z-20">
        <div className="text-2xl font-black text-[#7a33ff] italic font-display-lg tracking-tighter uppercase">
          INFO-CLASH
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 w-full">
        
        {/* Ornamen Latar Belakang */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7a33ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />

        <div className="w-full max-w-[450px] flex flex-col gap-8 md:gap-10 relative z-10">
          
          <div className="text-center flex flex-col gap-2">
            <div className="mx-auto bg-[#1a1a1c] border border-[#2a2a2b] w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-[#ffc703]" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <h1 className="font-black text-[32px] md:text-[40px] font-display-lg text-white tracking-wide uppercase leading-none">
              HOST LOGIN
            </h1>
            <p className="text-sm md:text-base text-gray-400 font-medium">
              Secure access to the Admin Control Panel.
            </p>
          </div>

          <form 
            className="flex flex-col gap-5 md:gap-6 w-full"
            onSubmit={handleLogin}
          >
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-xs md:text-sm tracking-widest font-bold text-gray-500 uppercase">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">mail</span>
                <input 
                  type="email" 
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="admin@info-clash.com"
                  className="w-full bg-[#1a1a1c] border-2 border-[#2a2a2b] pl-12 pr-4 py-4 text-white font-medium focus:border-[#7a33ff] focus:outline-none transition-colors rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-xs md:text-sm tracking-widest font-bold text-gray-500 uppercase">PASSWORD</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">lock</span>
                <input 
                  type="password" 
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1c] border-2 border-[#2a2a2b] pl-12 pr-4 py-4 text-white font-medium focus:border-[#7a33ff] focus:outline-none transition-colors rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] disabled:cursor-not-allowed text-white py-4 flex items-center justify-center gap-3 transition-colors rounded-lg shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xl font-bold tracking-wider uppercase">LOGGING IN...</span>
                </span>
              ) : (
                <>
                  <span className="text-xl font-bold tracking-wider uppercase">LOG IN</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>
          
          {/* Back to Participant Link */}
          <div className="text-center">
            <button 
              onClick={() => navigate('/join')}
              className="text-xs font-bold tracking-widest text-gray-500 hover:text-[#7a33ff] uppercase transition-colors"
            >
              ← Back to Join as Participant
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
