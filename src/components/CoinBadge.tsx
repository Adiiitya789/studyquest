import { Coins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CoinBadge() {
  const { profile } = useAuth();
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
      <Coins size={16} className="text-amber-400" />
      <span className="text-sm font-semibold text-amber-300 tabular-nums">
        {profile?.coins ?? 0}
      </span>
    </div>
  );
}
