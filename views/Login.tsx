
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabase Auth requires an email. We simulate a login with a domain-mapped username
      // if the user provided just a username/ID.
      const email = username.includes('@') ? username : `${username}@fiqhacademy.com`;
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Ensure a profile exists in the 'users' table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Account profile not found in database. Contact Admin.");
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-10">
          <div className="bg-blue-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-300">
            <i className="fas fa-user-clock text-5xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">FA-AMS</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] mt-1 tracking-[0.2em]">Fiqh Academy Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                <i className="fas fa-id-badge"></i>
              </span>
              <input
                type="text"
                required
                className="w-full pl-11 pr-4 py-4 border border-slate-100 bg-slate-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="FAMC1001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                <i className="fas fa-shield-alt"></i>
              </span>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-4 border border-slate-100 bg-slate-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                SIGN IN
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Secured by Supabase Cloud</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
