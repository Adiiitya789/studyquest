import { NavLink } from 'react-router-dom';
// Added Brain to the import here!
import { Home, Timer, Trophy, BarChart3, User, ListTodo, Brain } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/tasks', label: 'Tasks', icon: ListTodo }, 
  { to: '/room', label: 'Timer', icon: Timer },
  { to: '/ai-quiz', label: 'AI Quiz', icon: Brain }, // Added the AI Quiz here!
  { to: '/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto max-w-2xl px-4 pb-3">
        {/* Added overflow-x-auto just in case the 7 items get too crowded on small screens */}
        <div className="glass rounded-2xl shadow-2xl shadow-black/40 px-2 py-2 flex items-center justify-around overflow-x-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-fit ${
                  isActive
                    ? 'text-primary-300 bg-primary-500/10'
                    : 'text-coffee-500 hover:text-coffee-300'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}