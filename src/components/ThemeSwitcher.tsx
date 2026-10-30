import { Palette } from 'lucide-react';
import { useTheme, THEME_ORDER } from '@/context/ThemeContext';

// The same Void/Canopy/Summit/Studio picker that used to live only in the
// Study Room — rendered once in App.tsx's ProtectedLayout so it shows up
// (and works) on every page, not just the timer.
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 mb-4 animate-enter-up stagger-1 overflow-x-auto">
      <Palette size={14} className="text-coffee-400 shrink-0 transition-transform duration-300 hover:rotate-45" />
      <div className="flex bg-coffee-800/50 backdrop-blur-md rounded-full p-1 border border-white/5 shrink-0 shadow-inner">
        {THEME_ORDER.map((key) => {
          const isActive = theme === key;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap btn-press ${
                isActive
                  ? 'bg-primary-500/25 text-primary-200 border border-primary-500/30 shadow-sm'
                  : 'text-coffee-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
