import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; 
import { SUBJECTS } from '@/lib/constants';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mainSubject, setMainSubject] = useState(SUBJECTS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // NEW: Added success message state
  const [loading, setLoading] = useState(false);

  // The Google Login Function
  async function handleGoogleLogin() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error("Error logging in with Google:", error.message);
      setError(error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage(''); // Reset message on new try
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await signUp(email, password, displayName, mainSubject);
        setMessage('Account created! Please check your inbox (and spam/junk folder) to confirm your email.');
      }
    } catch (err: any) {
      console.error("Full signup error:", err); 
      setError(err?.message || 'Something went wrong'); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-coffee-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo (Minimalist) */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">StudyQuest</h1>
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl shadow-black/40">
          {/* Tabs */}
          <div className="flex p-1 bg-coffee-800/50 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-[#f1d6b9] text-coffee-900 shadow-lg shadow-black/20' : 'text-coffee-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-[#f1d6b9] text-coffee-900 shadow-lg shadow-black/20' : 'text-coffee-400'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* The Google Button & Divider */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-coffee-900 font-bold hover:bg-coffee-100 transition-all active:scale-[0.98] mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-coffee-500 font-medium uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Original Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-coffee-400 mb-1.5 block">First Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-500 hover:text-coffee-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Main Subject</label>
                <select
                  value={mainSubject}
                  onChange={(e) => setMainSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-coffee-800">{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Success Message Box with Spam Warning */}
            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm animate-fade-in text-center space-y-1.5">
                <p className="text-emerald-300 font-semibold">{message}</p>
                <p className="text-xs text-coffee-300">
                  ⚠️ Don't see it? Be sure to check your <span className="text-white font-medium underline">Spam / Junk</span> folder!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#f1d6b9] text-coffee-900 font-semibold shadow-lg shadow-black/20 hover:brightness-95 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-coffee-500">
            Need help? <a href="mailto:sdnakjnjdfhasffs@gmail.com" className="text-primary-400 hover:text-primary-300 hover:underline transition-colors">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
