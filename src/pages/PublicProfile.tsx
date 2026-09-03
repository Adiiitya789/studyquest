import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BADGES, PERKS } from '@/lib/constants';
import { getBadgeIcon } from '@/lib/badges';
import type { PublicProfile as PublicProfileType } from '@/lib/types';
import VipBadge from '@/components/VipBadge';
import { ArrowLeft, Lock, Coins } from 'lucide-react';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data } = await supabase.rpc('get_public_profile', { p_username: username });
      setProfile(data?.[0] as PublicProfileType | null ?? null);
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-coffee-400 hover:text-white mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-coffee-400">User not found or has a private profile.</p>
        </div>
      </div>
    );
  }

  const totalHours = profile.total_hours;
  const perkIds = profile.perk_ids ?? [];

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-coffee-400 hover:text-white mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Profile header */}
      <div className="glass-card p-6 mb-5 text-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg shadow-accent-500/20">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span>{profile.display_name}</span>
            {profile.is_vip && <VipBadge size="sm" />}
          </h1>
          <p className="text-sm text-coffee-400">@{profile.username}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 mt-2">
            <span className="text-xs text-accent-300">{profile.main_subject}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{totalHours.toFixed(1)}</p>
              <p className="text-[10px] text-coffee-400">Hours</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{profile.tasks_done}</p>
              <p className="text-[10px] text-coffee-400">Tasks Done</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{BADGES.filter((b) => totalHours >= b.hours).length}</p>
              <p className="text-[10px] text-coffee-400">Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-5 mb-5">
        <p className="text-sm font-semibold text-white mb-3">Badges</p>
        <div className="grid grid-cols-6 gap-2">
          {BADGES.map((badge) => {
            const unlocked = totalHours >= badge.hours;
            const Icon = getBadgeIcon(badge);
            return (
              <div
                key={badge.id}
                className={`aspect-square rounded-xl flex items-center justify-center ${unlocked ? 'bg-primary-500/15' : 'bg-coffee-800/40'}`}
                title={`${badge.name} (${badge.hours}h)`}
              >
                {unlocked ? <Icon size={20} className="text-primary-300" /> : <Lock size={16} className="text-coffee-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Perks */}
      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-white mb-3">Unlocked Perks</p>
        {perkIds.length === 0 ? (
          <p className="text-sm text-coffee-400 py-4 text-center">No perks unlocked yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {perkIds.map((pid) => {
              const perk = PERKS.find((p) => p.id === pid);
              if (!perk) return null;
              return (
                <div key={pid} className="aspect-square rounded-xl bg-primary-500/10 flex items-center justify-center" title={perk.name}>
                  <Coins size={20} className="text-primary-300" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
