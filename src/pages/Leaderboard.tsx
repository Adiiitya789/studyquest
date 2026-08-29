import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BADGES } from '@/lib/constants';
import { getBadgeIcon } from '@/lib/badges';
import type { LeaderboardEntry, StudyGroup } from '@/lib/types';
import { Trophy, Users, Plus, X, Crown, Hash, Lock } from 'lucide-react';

type Tab = 'global' | 'squads';
type Timeframe = 'week' | 'month' | 'all';

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('global');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState<Record<string, LeaderboardEntry[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Public Profile Modal States
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingPerks, setViewingPerks] = useState<string[]>([]);
  const [viewingStats, setViewingStats] = useState({ hours: 0, coins: 0 });
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_global_leaderboard', { p_timeframe: timeframe });
      setGlobalData(data as LeaderboardEntry[] ?? []);
    })();
  }, [timeframe]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      const groupIds = (myGroups ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) return;
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      setGroups(groupData as StudyGroup[] ?? []);

      for (const gid of groupIds) {
        const { data: lb } = await supabase.rpc('get_group_leaderboard', {
          p_group_id: gid,
          p_timeframe: 'all',
        });
        setGroupLeaderboard((prev) => ({ ...prev, [gid]: lb as LeaderboardEntry[] ?? [] }));
      }
    })();
  }, [user]);

  async function createGroup() {
    if (!user || !newGroupName.trim()) return;
    const { data } = await supabase
      .from('groups')
      .insert({ name: newGroupName.trim(), owner_id: user.id })
      .select()
      .single();
    if (data) {
      const group = data as StudyGroup;
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
      setGroups([group, ...groups]);
      setNewGroupName('');
      setShowCreate(false);
    }
  }

  async function joinGroup() {
    if (!user || !joinCode.trim()) return;
    setJoinError('');
    try {
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!group) {
        setJoinError('Invalid squad code!');
        return;
      }
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id });
      if (insertError) {
        if (insertError.code === '23505') throw new Error('You are already in this squad!');
        throw insertError;
      }
      setGroups([group as StudyGroup, ...groups.filter((g) => g.id !== group.id)]);
      setJoinCode('');
      const { data: lb } = await supabase.rpc('get_group_leaderboard', {
        p_group_id: group.id,
        p_timeframe: 'all',
      });
      setGroupLeaderboard((prev) => ({ ...prev, [group.id]: lb as LeaderboardEntry[] ?? [] }));
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join squad.');
    }
  }

  // Fetch data when a user clicks on someone's row
  async function openProfile(userId: string, totalHours: number) {
    setLoadingProfile(true);
    setViewingUser({ id: userId }); // Show loading state modal instantly
    
    // 1. Get their basic profile info
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    // 2. Get their equipped perks
    const { data: userPerks } = await supabase.from('perks').select('perk_id').eq('user_id', userId);
    
    setViewingUser(prof);
    setViewingPerks(userPerks?.map(p => p.perk_id) || []);
    setViewingStats({ hours: totalHours, coins: prof?.coins || 0 });
    setLoadingProfile(false);
  }

  // Parse perks for the modal styling
  const hasDiamondFrame = viewingPerks.includes('diamond_frame');
  const hasGoldFrame = viewingPerks.includes('gold_frame');
  const hasFlameAura = viewingPerks.includes('flame_aura');
  const hasNeonGlow = viewingPerks.includes('neon_glow');
  const hasEmeraldTheme = viewingPerks.includes('emerald_theme');
  const hasCrown = viewingPerks.includes('crown_icon');
  const hasCrystal = viewingPerks.includes('crystal_badge');

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-300">
          <Trophy size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboards</h1>
          <p className="text-sm text-coffee-400">See how you stack up</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-coffee-800/50 rounded-xl mb-5">
        <button
          onClick={() => setTab('global')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'global' ? 'bg-[#f1d6b9] text-coffee-900' : 'text-coffee-400'
          }`}
        >
          <Trophy size={16} /> Global
        </button>
        <button
          onClick={() => setTab('squads')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'squads' ? 'bg-[#f1d6b9] text-coffee-900' : 'text-coffee-400'
          }`}
        >
          <Users size={16} /> My Squads
        </button>
      </div>

      {tab === 'global' && (
        <>
          <div className="flex gap-2 mb-4">
            {(['week', 'month', 'all'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'bg-coffee-800/30 text-coffee-400 border border-white/5'
                }`}
              >
                {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {globalData.length === 0 ? (
              <p className="text-sm text-coffee-400 text-center py-8">No data yet for this period.</p>
            ) : (
              globalData.map((entry, i) => (
                <div
                  key={entry.user_id}
                  onClick={() => openProfile(entry.user_id, entry.total_hours)}
                  className={`glass-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all ${entry.user_id === user?.id ? 'border-primary-500/30' : ''}`}
                >
                  <span className={`text-sm font-bold w-6 ${i < 3 ? 'text-amber-400' : 'text-coffee-500'}`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coffee-600 to-coffee-700 flex items-center justify-center text-sm font-bold text-white">
                    {entry.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{entry.display_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-white tabular-nums">{entry.total_hours}h</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === 'squads' && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(true)}
                className="flex-1 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary-500/20 transition-all"
              >
                <Plus size={16} /> Create Squad
              </button>
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-coffee-800/50 border border-white/5 relative">
                <Hash size={16} className="text-coffee-500" />
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    setJoinError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
                  placeholder="Join code"
                  maxLength={6}
                  className="flex-1 bg-transparent text-white placeholder-coffee-500 text-sm focus:outline-none uppercase"
                />
                <button onClick={joinGroup} className="text-primary-300 hover:text-primary-200">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {joinError && <p className="text-xs text-rose-400 mt-2 text-right pr-2 animate-fade-in">{joinError}</p>}
          </div>

          {groups.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Users size={32} className="mx-auto text-coffee-600 mb-2" />
              <p className="text-sm text-coffee-400">No squads yet. Create one or join with a code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center">
                        <Users size={18} className="text-accent-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{group.name}</p>
                        <p className="text-xs text-coffee-500">
                          Code: <span className="font-mono text-primary-300">{group.invite_code}</span>
                        </p>
                      </div>
                    </div>
                    {group.owner_id === user?.id && <Crown size={16} className="text-amber-400" />}
                  </div>
                  <div className="space-y-1.5">
                    {(groupLeaderboard[group.id] ?? []).map((entry, i) => (
                      <div 
                        key={entry.user_id} 
                        onClick={() => openProfile(entry.user_id, entry.total_hours)}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <span className={`text-xs font-bold w-5 ${i < 3 ? 'text-amber-400' : 'text-coffee-500'}`}>#{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-coffee-600 to-coffee-700 flex items-center justify-center text-xs font-bold text-white">
                          {entry.display_name.charAt(0)}
                        </div>
                        <span className="flex-1 text-sm text-white truncate">{entry.display_name}</span>
                        <span className="text-xs text-coffee-400 tabular-nums">{entry.total_hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Public Profile Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingUser(null)}>
          <div className="glass-card w-full max-w-sm overflow-hidden animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
            
            {loadingProfile ? (
              <div className="p-12 text-center text-coffee-400">Loading profile...</div>
            ) : (
              <>
                <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 z-10 text-coffee-400 hover:text-white bg-coffee-900/50 rounded-full p-1">
                  <X size={20} />
                </button>

                <div className={`p-6 text-center relative overflow-hidden ${viewingPerks.includes('dark_mode') ? 'bg-coffee-950/90' : ''}`}>
                  {/* Background Glows */}
                  <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl ${hasEmeraldTheme ? 'bg-emerald-500/20' : 'bg-primary-500/10'}`} />
                  <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl ${hasEmeraldTheme ? 'bg-teal-500/20' : 'bg-accent-500/10'}`} />
                  
                  <div className="relative">
                    {/* Avatar */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4
                      ${hasEmeraldTheme ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-primary-400 to-accent-500'}
                      ${hasDiamondFrame ? 'border-4 border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.7)]' : hasGoldFrame ? 'border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'shadow-lg shadow-black/20'}
                      ${hasFlameAura ? 'ring-4 ring-orange-500/80 shadow-[0_0_40px_rgba(249,115,22,0.8)] animate-pulse' : ''}
                    `}>
                      {viewingUser.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    
                    {/* Name */}
                    <h2 className={`text-2xl font-bold text-white flex items-center justify-center gap-2 mb-1
                      ${hasNeonGlow ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : ''}
                    `}>
                      {hasCrystal && <span className="text-xl">💎</span>}
                      {viewingUser.display_name}
                      {hasCrown && <span className="text-xl drop-shadow-none">👑</span>}
                    </h2>
                    
                    <p className="text-sm text-coffee-400 mb-4">@{viewingUser.username}</p>
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 text-xs text-primary-300 font-medium mb-6">
                      Main: {viewingUser.main_subject}
                    </span>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 border-t border-white/5 pt-6">
                      <div>
                        <p className="text-2xl font-bold text-white tabular-nums">{viewingStats.hours}</p>
                        <p className="text-xs text-coffee-400">Total Hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges Display */}
                <div className="bg-coffee-900/50 p-6 border-t border-white/5">
                  <p className="text-xs font-semibold text-coffee-400 mb-3 text-center uppercase tracking-wider">Earned Badges</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {BADGES.map((badge) => {
                      const unlocked = viewingStats.hours >= badge.hours;
                      const Icon = getBadgeIcon(badge);
                      return (
                        <div
                          key={badge.id}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? 'bg-primary-500/15' : 'bg-coffee-800/40 opacity-50'}`}
                          title={`${badge.name} (${badge.hours}h)`}
                        >
                          {unlocked ? <Icon size={18} className="text-primary-300" /> : <Lock size={14} className="text-coffee-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create modal (unchanged) */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Squad</h3>
              <button onClick={() => setShowCreate(false)} className="text-coffee-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Squad Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                  placeholder="Study Squad"
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <button
                onClick={createGroup}
                className="w-full py-3 rounded-xl bg-[#f1d6b9] text-coffee-900 font-semibold hover:brightness-95 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}