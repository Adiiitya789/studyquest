import { Palette } from 'lucide-react';
import { useTheme, THEME_ORDER } from '@/context/ThemeContext';

// The same Void/Canopy/Summit/Studio picker that used to live only in the
// Study Room — rendered once in App.tsx's ProtectedLayout so it shows up
// (and works) on every page, not just the timer.
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 mb-4 animate-fade-in overflow-x-auto">
      <Palette size={14} className="text-coffee-500 shrink-0" />
      <div className="flex bg-coffee-800/50 rounded-full p-1 border border-white/5 shrink-0">
        {THEME_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
              theme === key
                ? 'bg-primary-500/20 text-primary-300'
                : 'text-coffee-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
