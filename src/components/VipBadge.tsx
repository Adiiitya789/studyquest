import { Sparkles } from 'lucide-react';

interface VipBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export default function VipBadge({ size = 'sm', className = '' }: VipBadgeProps) {
  const sizeClasses = {
    xs: 'w-4 h-4 rounded-[4px]',
    sm: 'w-5 h-5 rounded-[5px]',
    md: 'w-6 h-6 rounded-md',
    lg: 'w-7 h-7 rounded-lg',
  };

  const iconSizes = {
    xs: 9,
    sm: 11,
    md: 13,
    lg: 16,
  };

  return (
    <span
      title="VIP Member"
      className={`inline-flex items-center justify-center shrink-0 aspect-square select-none bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 text-coffee-950 border border-amber-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.35),0_0_8px_rgba(245,158,11,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.7)] transition-transform duration-150 hover:scale-110 active:scale-95 ${sizeClasses[size]} ${className}`}
    >
      <Sparkles
        size={iconSizes[size]}
        className="fill-coffee-950 text-coffee-950 shrink-0"
      />
    </span>
  );
}
