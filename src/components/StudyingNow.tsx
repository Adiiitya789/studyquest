import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Circle } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

export default function StudyingNow() {
  const [onlineUsers, setOnlineUsers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_global_leaderboard', { p_timeframe: 'week' });
      setOnlineUsers((data ?? []).slice(0, 8) as LeaderboardEntry[]);
    })();
  }, []);

  return (
    <div className="glass-card bg-coffee-900/60 backdrop-blur-md p-4 mb-8 border border-white/5 w-full max-w-md mx-auto animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-coffee-400" />
        <p className="text-sm font-semibold text-white">Studying Now</p>
        <span className="ml-auto text-xs text-coffee-400">{onlineUsers.length} active this week</span>
      </div>
      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <p className="text-xs text-coffee-500 py-2">No one else is active right now.</p>
        ) : (
          onlineUsers.map((u, i) => (
            <div key={u.user_id} className="flex items-center gap-3 py-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <Circle size={8} className="absolute -bottom-0.5 -right-0.5 text-green-400 fill-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate drop-shadow-sm">{u.display_name}</p>
                <p className="text-xs text-coffee-400">{u.main_subject}</p>
              </div>
              <span className="text-xs text-coffee-400 tabular-nums">{u.total_hours}h</span>
              {i < 3 && <span className="text-xs">🏆</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

