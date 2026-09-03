import { Sparkles } from 'lucide-react';

interface VipBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export default function VipBadge({ size = 'sm', className = '', showIcon = true }: VipBadgeProps) {
  const sizeClasses = {
    xs: 'text-[8px] px-1 py-0.5 gap-0.5 rounded',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 rounded-md',
    md: 'text-xs px-2 py-0.5 gap-1 rounded-md font-black',
    lg: 'text-sm px-2.5 py-1 gap-1.5 rounded-lg font-black',
  };

  const iconSizes = {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <span
      title="VIP Member"
      className={`inline-flex items-center font-black uppercase tracking-wider bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-coffee-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-200/90 select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <Sparkles
          size={iconSizes[size]}
          className="fill-coffee-950 text-coffee-950 shrink-0"
        />
      )}
      <span>VIP</span>
    </span>
  );
}
