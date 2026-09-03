import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PERKS, BADGES } from '@/lib/constants';
import { getBadgeIcon } from '@/lib/badges';
import type { Perk } from '@/lib/types';
import VipBadge from '@/components/VipBadge';
import { Coins, LogOut, Lock, Check, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [perks, setPerks] = useState<string[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: perkData } = await supabase
        .from('perks')
        .select('perk_id')
        .eq('user_id', user.id);
      setPerks((perkData as Perk[] ?? []).map((p) => p.perk_id));

      const { data: logs } = await supabase
        .from('study_logs')
        .select('minutes, created_at')
        .eq('user_id', user.id)
        .eq('manual', false);
      const mins = (logs ?? []).reduce((sum, l) => sum + l.minutes, 0);
      setTotalMinutes(mins);

      const dates = new Set<string>();
      (logs ?? []).forEach((l) => {
        const d = new Date(l.created_at);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (dates.has(key)) s++;
        else if (i > 0) break;
      }
      setStreak(s);

      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('done', true);
      setTasksDone(count ?? 0);
    })();
  }, [user]);

  const totalHours = totalMinutes / 60;

  async function buyPerk(perkId: string, cost: number) {
    if (!user || !profile || profile.coins < cost) return;
    setBuying(perkId);

    // 1. Primary Secure RPC: Atomic server-side cost validation, coin deduction, and perk grant
    const { error: rpcError } = await supabase.rpc('buy_perk', {
      p_perk_id: perkId,
    });

    if (rpcError) {
      console.warn('buy_perk RPC fallback:', rpcError.message);
      // Fallback in case RPC is not yet created in the connected database
      const newCoins = profile.coins - cost;
      const { error: perkError } = await supabase.from('perks').insert({
        user_id: user.id,
        perk_id: perkId,
      });
      if (!perkError) {
        await supabase
          .from('profiles')
          .update({ coins: newCoins })
          .eq('id', user.id);
      }
    }

    setPerks((prev) => [...prev, perkId]);
    await refreshProfile();
    setBuying(null);
  }

  async function toggleLeaderboard() {
    if (!user || !profile) return;
    const newVal = !profile.show_on_leaderboard;
    await supabase.from('profiles').update({ show_on_leaderboard: newVal }).eq('id', user.id);
    await refreshProfile();
  }

  // --- PERK LOGIC: Check what the user owns ---
  const hasDarkMode = perks.includes('dark_mode');
  const hasGoldFrame = perks.includes('gold_frame');
  const hasDiamondFrame = perks.includes('diamond_frame');
  const hasFlameAura = perks.includes('flame_aura');
  const hasNeonGlow = perks.includes('neon_glow');
  const hasEmeraldTheme = perks.includes('emerald_theme');
  const hasCrown = perks.includes('crown_icon');
  const hasCrystal = perks.includes('crystal_badge');

  return (
    <div className="animate-fade-in">
      {/* Profile header */}
      <div className={`glass-card p-6 mb-5 text-center relative overflow-hidden transition-all duration-500 ${hasDarkMode ? 'bg-coffee-950/90 border-white/5' : ''}`}>
        
        {/* Dynamic Background Glows */}
        <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl ${hasEmeraldTheme ? 'bg-emerald-500/20' : 'bg-primary-500/10'}`} />
        <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl ${hasEmeraldTheme ? 'bg-teal-500/20' : 'bg-accent-500/10'}`} />
        
        <div className="relative">
          {/* Dynamic Avatar styling */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 transition-all duration-500
            ${hasEmeraldTheme ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-primary-400 to-accent-500'}
            ${hasDiamondFrame ? 'border-4 border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.7)]' : hasGoldFrame ? 'border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'shadow-lg shadow-black/20'}
            ${hasFlameAura ? 'ring-4 ring-orange-500/80 shadow-[0_0_40px_rgba(249,115,22,0.8)] animate-pulse' : ''}
          `}>
            {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          
          {/* Dynamic Name styling */}
          <h1 className={`text-xl font-bold text-white flex items-center justify-center gap-2 transition-all
            ${hasNeonGlow ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : ''}
          `}>
            {hasCrystal && <span className="text-lg">💎</span>}
            <span>{profile?.display_name}</span>
            {hasCrown && <span className="text-lg drop-shadow-none">👑</span>}
            {profile?.is_vip && <VipBadge size="sm" />}
          </h1>
          
          <p className="text-sm text-coffee-400">@{profile?.username}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 mt-2">
            <span className="text-xs text-primary-300">{profile?.main_subject}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{totalHours.toFixed(1)}</p>
              <p className="text-[10px] text-coffee-400">Hours</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{streak}</p>
              <p className="text-[10px] text-coffee-400">Streak</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{tasksDone}</p>
              <p className="text-[10px] text-coffee-400">Tasks</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-300 tabular-nums">{profile?.coins ?? 0}</p>
              <p className="text-[10px] text-coffee-400">Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-card p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.show_on_leaderboard ? <Eye size={18} className="text-primary-300" /> : <EyeOff size={18} className="text-coffee-500" />}
            <div>
              <p className="text-sm font-medium text-white">Leaderboard Visibility</p>
              <p className="text-xs text-coffee-400">{profile?.show_on_leaderboard ? 'Visible to others' : 'Hidden from rankings'}</p>
            </div>
          </div>
          <button
            onClick={toggleLeaderboard}
            className={`w-11 h-6 rounded-full transition-all relative ${profile?.show_on_leaderboard ? 'bg-primary-500' : 'bg-coffee-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${profile?.show_on_leaderboard ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-5 mb-5">
        <p className="text-sm font-semibold text-white mb-3">Badges Earned</p>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((badge) => {
            const unlocked = totalHours >= badge.hours;
            const Icon = getBadgeIcon(badge);
            return (
              <div
                key={badge.id}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${unlocked ? 'bg-primary-500/15' : 'bg-coffee-800/40'}`}
                title={`${badge.name} (${badge.hours}h)`}
              >
                {unlocked ? <Icon size={20} className="text-primary-300" /> : <Lock size={18} className="text-coffee-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Perks Shop */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Perks Shop</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10">
            <Coins size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">{profile?.coins ?? 0}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PERKS.map((perk) => {
            const owned = perks.includes(perk.id);
            const canAfford = (profile?.coins ?? 0) >= perk.cost;
            return (
              <div
                key={perk.id}
                className={`glass-card p-4 text-center transition-all ${owned ? 'border-primary-500/30 bg-primary-500/5' : ''}`}
              >
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${owned ? 'bg-primary-500/15' : 'bg-coffee-800/50'}`}>
                  {owned ? (
                    <Check size={22} className="text-primary-300" />
                  ) : (
                    <Lock size={20} className="text-coffee-500" />
                  )}
                </div>
                <p className="text-sm font-medium text-white">{perk.name}</p>
                <p className="text-[10px] text-coffee-500 mb-3">{perk.description}</p>
                {owned ? (
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-primary-500/10 text-xs font-semibold text-primary-300">
                    Unlocked
                  </span>
                ) : (
                  <button
                    onClick={() => buyPerk(perk.id, perk.cost)}
                    disabled={!canAfford || buying === perk.id}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      canAfford
                        ? 'bg-[#f1d6b9] text-coffee-900 hover:scale-105 active:scale-95'
                        : 'bg-coffee-800/50 text-coffee-500'
                    } disabled:opacity-50`}
                  >
                    <Coins size={12} /> {perk.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all"
      >
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}