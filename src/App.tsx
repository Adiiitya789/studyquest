import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme, THEME_BACKGROUNDS } from '@/context/ThemeContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Room from '@/pages/Room';
import Tasks from '@/pages/Tasks';
import Stats from '@/pages/Stats';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import BottomNav from '@/components/BottomNav';
import type { ReactNode } from 'react';
import Admin from './pages/Admin';
import AIQuiz from './pages/AIQuiz';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-950">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-coffee-950 pb-24 relative">
      {/* Theme background — same picker as Study Room, now applied app-wide */}
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
      </div>
      <BottomNav />
    </div>
  );
}

// Same auth gate as ProtectedLayout, but without the bottom-nav/max-width app
// shell — Admin renders its own full-bleed layout.
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
