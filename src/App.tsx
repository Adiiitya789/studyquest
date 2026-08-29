import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme, THEME_BACKGROUNDS } from '@/context/ThemeContext';
import { StudyProvider } from '@/context/StudyContext';
import { AudioProvider } from '@/context/AudioContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import SoundPlayer from '@/components/SoundPlayer';
import FloatingAudioPill from '@/components/FloatingAudioPill';
import StudyingNow from '@/components/StudyingNow';
import BottomNav from '@/components/BottomNav';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Room from '@/pages/Room';
import Tasks from '@/pages/Tasks';
import Stats from '@/pages/Stats';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import Admin from '@/pages/Admin';
import AIQuiz from '@/pages/AIQuiz';
import type { ReactNode } from 'react';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-950">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const isRoom = location.pathname === '/room';

  return (
    <div className="min-h-screen bg-coffee-950 pb-24 relative">
      {/* Theme background */}
      {theme !== 'void' && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 pointer-events-none"
          style={{ backgroundImage: `url(${THEME_BACKGROUNDS[theme]})` }}
        />
      )}
      <div
        className={`fixed inset-0 w-full h-full pointer-events-none transition-all duration-1000 ${
          theme === 'void' ? 'bg-coffee-950' : 'bg-coffee-950/80 backdrop-blur-sm'
        }`}
      />
      <div className="mx-auto max-w-2xl px-4 pt-6 relative z-10">
        <ThemeSwitcher />
        {children}

        {/* Persistent Audio Player — Kept mounted across all route transitions */}
        <div className={isRoom ? 'w-full max-w-md mx-auto mb-6' : 'fixed -left-[99999px] opacity-0 pointer-events-none'}>
          <SoundPlayer isEmbedded={isRoom} />
        </div>

        {/* Studying Now on Room Page */}
        {isRoom && <StudyingNow />}
      </div>

      {/* Global Floating Mini Audio Pill for other pages */}
      <FloatingAudioPill />

      <BottomNav />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-950">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-950">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/room" element={<ProtectedLayout><Room /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/stats" element={<ProtectedLayout><Stats /></ProtectedLayout>} />
      <Route path="/leaderboard" element={<ProtectedLayout><Leaderboard /></ProtectedLayout>} />
      <Route path="/ai-quiz" element={<ProtectedLayout><AIQuiz /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/u/:username" element={<ProtectedLayout><PublicProfile /></ProtectedLayout>} />
      <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StudyProvider>
          <AudioProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AudioProvider>
        </StudyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
