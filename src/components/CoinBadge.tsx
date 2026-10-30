import { Coins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CoinBadge() {
  const { profile } = useAuth();
  return (
    <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/15 transition-all duration-300 select-none shadow-sm">
      <Coins size={16} className="text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
      <span className="text-sm font-semibold text-amber-300 tabular-nums">
        {profile?.coins ?? 0}
      </span>
    </div>
  );
}
