import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, Coins, Activity } from 'lucide-react';

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalCoins: 0 });
  const [loading, setLoading] = useState(true);
  const [targetEmail, setTargetEmail] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    if (!user || !profile) return; // Wait for Supabase to confirm who is logged in

    // This is a UX nicety only, not the real security boundary — every RPC
    // this page calls (god_mode_add_coins) independently checks
    // profiles.is_admin server-side, so even if someone bypassed this check
    // (or hit the RPC directly from devtools) the database still refuses.
    if (!profile.is_admin) {
      navigate('/dashboard');
      return;
    }

    async function fetchStats() {
      // 1. Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Get total coins across the entire app
      const { data: coinData } = await supabase.from('profiles').select('coins');
      const totalCoins = coinData?.reduce((sum, profile) => sum + (profile.coins || 0), 0) || 0;
      
      setStats({
        totalUsers: userCount || 0,
        totalCoins: totalCoins
      });
      setLoading(false);
    }

    fetchStats();
  }, [user, profile, navigate]);

  async function handleGodMode(e: React.FormEvent) {
    e.preventDefault();
    setIsGranting(true);
    
    // Call the custom SQL function we built in Phase 1
    const { error } = await supabase.rpc('god_mode_add_coins', {
      target_email: targetEmail,
      coin_amount: 100
    });

    if (error) {
      alert("Error granting coins: " + error.message);
    } else {
      alert(`Success! 100 coins granted to ${targetEmail}`);
      setTargetEmail(''); 
    }
    setIsGranting(false);
  }

  // Show a dark screen while verifying admin credentials
  if (loading) {
    return <div className="min-h-screen bg-coffee-950 flex items-center justify-center text-primary-400 font-bold animate-pulse">Accessing Secure Server...</div>;
  }

  return (
    <div className="min-h-screen bg-coffee-950 p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 mb-8">
          Admin Command Center
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stat Card 1: Users */}
          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-primary-500/20 shadow-lg shadow-primary-500/10">
            <div className="p-4 bg-primary-500/20 rounded-xl text-primary-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Total Registered Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
          </div>

          {/* Stat Card 2: Coins */}
          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
            <div className="p-4 bg-yellow-500/20 rounded-xl text-yellow-400">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Total Economy (Coins)</p>
              <p className="text-3xl font-bold text-white">{stats.totalCoins}</p>
            </div>
          </div>
        </div>

        {/* The God Mode Panel */}
        <div className="glass p-6 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 animate-pulse">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">God Mode Controls</h2>
              <p className="text-xs text-coffee-400 mt-1">Inject 100 coins directly into any user's wallet.</p>
            </div>
          </div>
          
          <form onSubmit={handleGodMode} className="flex flex-col sm:flex-row gap-4 relative">
            <input
              type="email"
              required
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Target User Email..."
              className="flex-1 px-4 py-3.5 rounded-xl bg-coffee-900/80 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={isGranting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 whitespace-nowrap"
            >
              {isGranting ? 'Authorizing...' : 'Grant 100 Coins'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
