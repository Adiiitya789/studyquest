import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type RoomTheme = 'void' | 'canopy' | 'summit' | 'studio';

// Background images for each theme. 'void' has no image — it just shows the
// plain coffee-brown app background.
export const THEME_BACKGROUNDS: Record<RoomTheme, string> = {
  void: '',
  canopy: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2532&auto=format&fit=crop',
  summit: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop',
  studio: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2678&auto=format&fit=crop',
};

// Display order for the theme switcher — Canopy first, Void last.
export const THEME_ORDER: RoomTheme[] = ['canopy', 'summit', 'studio', 'void'];

const STORAGE_KEY = 'studyquest_theme';

type ThemeContextValue = {
  theme: RoomTheme;
  setTheme: (theme: RoomTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): RoomTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'void' || stored === 'canopy' || stored === 'summit' || stored === 'studio') {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back silently.
  }
  return 'canopy';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<RoomTheme>(readStoredTheme);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore write failures — the theme just won't persist across reloads.
    }
  }, [theme]);

  function setTheme(next: RoomTheme) {
    setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
