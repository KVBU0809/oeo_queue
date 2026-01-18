
import React, { useState } from 'react';
import { ShieldCheck, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (success: boolean) => void;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Hardcoded credentials as requested
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'password123'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin(true);
    } else {
      setError('Invalid username or password');
      onLogin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden p-8 space-y-8 animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/20 mb-2">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Access</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Identify yourself to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text"
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white font-bold focus:border-indigo-500/50 outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white font-bold focus:border-indigo-500/50 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{error}</p>}

          <div className="flex flex-col gap-3 pt-2">
            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95"
            >
              Authorize Entry
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
