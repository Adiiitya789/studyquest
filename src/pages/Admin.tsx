import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AdminUserRow } from '@/lib/types';
import { Users, Coins, Activity, Search, ShieldCheck, Clock, ListChecks, Sparkles } from 'lucide-react';

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [targetEmail, setTargetEmail] = useState('');
  const [amount, setAmount] = useState('100');
  const [isGranting, setIsGranting] = useState(false);

  async function fetchDashboard() {
    const { data, error } = await supabase.rpc('get_admin_dashboard');
    if (error) {
      console.error('Failed to load admin dashboard:', error.message);
      setLoadError(error.message);
    } else {
      setLoadError(null);
      setRows((data ?? []) as AdminUserRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user || !profile) return; // Wait for Supabase to confirm who is logged in

    // This is a UX nicety only, not the real security boundary — every RPC
    // this page calls (get_admin_dashboard, god_mode_add_coins) independently
    // checks profiles.is_admin server-side, so even if someone bypassed this
    // check (or hit the RPCs directly from devtools) the database still refuses.
    if (!profile.is_admin) {
      navigate('/dashboard');
      return;
    }

    fetchDashboard();
  }, [user, profile, navigate]);

  const stats = useMemo(() => {
    return {
      totalUsers: rows.length,
      totalCoins: rows.reduce((sum, r) => sum + (r.coins || 0), 0),
      totalHours: rows.reduce((sum, r) => sum + (r.total_hours || 0), 0),
      totalTasksDone: rows.reduce((sum, r) => sum + (r.tasks_done || 0), 0),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.display_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function handleGodMode(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!targetEmail || Number.isNaN(parsedAmount) || parsedAmount === 0) return;

    setIsGranting(true);
    const { error } = await supabase.rpc('god_mode_add_coins', {
      target_email: targetEmail,
      coin_amount: parsedAmount,
    });

    if (error) {
      alert('Error updating coins: ' + error.message);
    } else {
      alert(
        `Success! ${parsedAmount > 0 ? 'Granted' : 'Removed'} ${Math.abs(parsedAmount)} coins ${
          parsedAmount > 0 ? 'to' : 'from'
        } ${targetEmail}`
      );
      setTargetEmail('');
      setAmount('100');
      await fetchDashboard();
    }
    setIsGranting(false);
  }

  // Show a dark screen while verifying admin credentials
  if (loading) {
    return (
      <div className="min-h-screen bg-coffee-950 flex items-center justify-center text-primary-400 font-bold animate-pulse">
        Accessing Secure Server...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-950 p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 mb-8">
          Admin Command Center
        </h1>

        {loadError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            Couldn't load the user directory: {loadError}. Make sure the{' '}
            <code className="text-rose-200">get_admin_dashboard</code> function has been created in Supabase.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-primary-500/20 shadow-lg shadow-primary-500/10">
            <div className="p-4 bg-primary-500/20 rounded-xl text-primary-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
            <div className="p-4 bg-yellow-500/20 rounded-xl text-yellow-400">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Total Economy (Coins)</p>
              <p className="text-3xl font-bold text-white">{stats.totalCoins}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Total Hours Studied</p>
              <p className="text-3xl font-bold text-white">{stats.totalHours.toFixed(1)}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl flex items-center gap-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <div className="p-4 bg-emerald-500/20 rounded-xl text-emerald-400">
              <ListChecks size={24} />
            </div>
            <div>
              <p className="text-coffee-400 text-sm font-medium">Tasks Completed</p>
              <p className="text-3xl font-bold text-white">{stats.totalTasksDone}</p>
            </div>
          </div>
        </div>

        {/* God Mode Panel */}
        <div className="glass p-6 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)] relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 animate-pulse">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">God Mode Controls</h2>
              <p className="text-xs text-coffee-400 mt-1">
                Add or remove coins directly from any user's wallet by email.
              </p>
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
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (e.g. 100 or -50)"
              className="sm:w-56 px-4 py-3.5 rounded-xl bg-coffee-900/80 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={isGranting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 whitespace-nowrap"
            >
              {isGranting ? 'Authorizing...' : 'Apply'}
            </button>
          </form>
          <p className="text-[11px] text-coffee-500 mt-2 relative">
            Positive amount grants coins, negative amount removes them. Balances never go below 0.
          </p>
        </div>

        {/* User Directory */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-white">Every User</h2>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, username, or email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-coffee-900/80 border border-white/5 text-white placeholder-coffee-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-coffee-500 border-b border-white/5">
                  <th className="px-2 py-2 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium text-right">Coins</th>
                  <th className="px-2 py-2 font-medium text-right">Hours</th>
                  <th className="px-2 py-2 font-medium text-right">Tasks Done</th>
                  <th className="px-2 py-2 font-medium text-right">Perks</th>
                  <th className="px-2 py-2 font-medium text-center">Public</th>
                  <th className="px-2 py-2 font-medium text-center">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-6 text-center text-coffee-500">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.user_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-2 py-3">
                        <p className="text-white font-medium">{r.display_name}</p>
                        <p className="text-coffee-500 text-xs">@{r.username}</p>
                      </td>
                      <td className="px-2 py-3 text-coffee-300">{r.email}</td>
                      <td className="px-2 py-3 text-right text-yellow-400 font-semibold tabular-nums">
                        {r.coins}
                      </td>
                      <td className="px-2 py-3 text-right text-coffee-300 tabular-nums">
                        {r.total_hours.toFixed(1)}
                      </td>
                      <td className="px-2 py-3 text-right text-coffee-300 tabular-nums">{r.tasks_done}</td>
                      <td className="px-2 py-3 text-right text-coffee-300 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles size={12} className="text-accent-400" />
                          {r.perks_count}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {r.show_on_leaderboard ? (
                          <span className="text-primary-400 text-xs">Yes</span>
                        ) : (
                          <span className="text-coffee-600 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {r.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <ShieldCheck size={12} /> Admin
                          </span>
                        ) : (
                          <span className="text-coffee-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
