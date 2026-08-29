import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BADGES } from '@/lib/constants';
import { getBadgeIcon } from '@/lib/badges';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { StudyLog } from '@/lib/types';
import { BarChart3, Clock, Flame, CheckCircle2, Lock } from 'lucide-react';

const PIE_COLORS = ['#2dd4bf', '#3b82f6', '#a78bfa', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#f97316', '#06b6d4', '#84cc16', '#e11d48', '#8b5cf6'];

type TimeframeMode = 'week' | 'month' | 'lifetime';

export default function Stats() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [timeframe, setTimeframe] = useState<TimeframeMode>('week');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('manual', false)
        .order('created_at', { ascending: true });
      setLogs(data as StudyLog[] ?? []);

      const dates = new Set<string>();
      (data ?? []).forEach((l) => {
        const d = new Date(l.created_at);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (dates.has(key)) s++;
        else if (i > 0) break;
      }
      setStreak(s);
    })();
  }, [user]);

  const totalMinutes = useMemo(() => logs.reduce((sum, l) => sum + l.minutes, 0), [logs]);
  const totalHours = totalMinutes / 60;

  const subjectData = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      map[l.subject] = (map[l.subject] ?? 0) + l.minutes / 60;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [logs]);

  // Chart Data based on selected timeframe
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekMap: Record<string, number> = {};
      days.forEach((d) => (weekMap[d] = 0));

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);

      logs.forEach((l) => {
        const d = new Date(l.created_at);
        if (d >= startOfWeek) {
          const dayIdx = (d.getDay() + 6) % 7;
          weekMap[days[dayIdx]] += l.minutes / 60;
        }
      });
      return days.map((d) => ({ name: d, hours: Math.round(weekMap[d] * 100) / 100 }));
    }

    if (timeframe === 'month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const buckets = [
        { name: '1-7', start: 1, end: 7, hours: 0 },
        { name: '8-14', start: 8, end: 14, hours: 0 },
        { name: '15-21', start: 15, end: 21, hours: 0 },
        { name: '22-28', start: 22, end: 28, hours: 0 },
        { name: '29+', start: 29, end: endOfMonth, hours: 0 },
      ];

      logs.forEach((l) => {
        const d = new Date(l.created_at);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const day = d.getDate();
          const bucket = buckets.find((b) => day >= b.start && day <= b.end);
          if (bucket) {
            bucket.hours += l.minutes / 60;
          }
        }
      });

      return buckets.map((b) => ({
        name: `Day ${b.name}`,
        hours: Math.round(b.hours * 100) / 100,
      }));
    }

    // Lifetime: All 12 calendar months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, number> = {};
    months.forEach((m) => (monthMap[m] = 0));

    logs.forEach((l) => {
      const d = new Date(l.created_at);
      const mIdx = d.getMonth();
      monthMap[months[mIdx]] += l.minutes / 60;
    });

    return months.map((m) => ({ name: m, hours: Math.round(monthMap[m] * 100) / 100 }));
  }, [logs, timeframe]);

  const timeframeTotalHours = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.hours, 0);
  }, [chartData]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-300">
          <BarChart3 size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Your Stats</h1>
          <p className="text-sm text-coffee-400">A look at your study journey</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <Clock size={20} className="mx-auto text-primary-300 mb-1" />
          <p className="text-xl font-bold text-white tabular-nums">{totalHours.toFixed(1)}</p>
          <p className="text-xs text-coffee-400">Total Hours</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Flame size={20} className="mx-auto text-orange-400 mb-1" />
          <p className="text-xl font-bold text-white tabular-nums">{streak}</p>
          <p className="text-xs text-coffee-400">Day Streak</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 size={20} className="mx-auto text-green-400 mb-1" />
          <p className="text-xl font-bold text-white tabular-nums">{BADGES.filter((b) => totalHours >= b.hours).length}</p>
          <p className="text-xs text-coffee-400">Badges</p>
        </div>
      </div>

      {/* Progress Bar Chart with Timeframe Switcher */}
      <div className="glass-card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-white">
              {timeframe === 'week' ? 'Weekly Progress' : timeframe === 'month' ? 'Monthly Progress' : 'Lifetime Progress'}
            </p>
            <p className="text-xs text-coffee-400 mt-0.5">
              {timeframeTotalHours.toFixed(2)}h logged {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : 'all-time'}
            </p>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center bg-coffee-950/70 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'week'
                  ? 'bg-[#f1d6b9] text-coffee-950 shadow-sm'
                  : 'text-coffee-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'month'
                  ? 'bg-[#f1d6b9] text-coffee-950 shadow-sm'
                  : 'text-coffee-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('lifetime')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'lifetime'
                  ? 'bg-[#f1d6b9] text-coffee-950 shadow-sm'
                  : 'text-coffee-400 hover:text-white'
              }`}
            >
              Lifetime
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              formatter={(v) => [`${v}h`, 'Hours']}
              cursor={{ fill: 'rgba(45, 212, 191, 0.05)' }}
            />
            <Bar dataKey="hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart: Hours by Subject */}
      <div className="glass-card p-5 mb-5">
        <p className="text-sm font-semibold text-white mb-4">Hours by Subject</p>
        {subjectData.length === 0 ? (
          <p className="text-sm text-coffee-400 py-12 text-center">No data yet. Start studying!</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={subjectData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={2}
              >
                {subjectData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                formatter={(v) => [`${v}h`, 'Hours']}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        {subjectData.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {subjectData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-coffee-400">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-white mb-4">Badges</p>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const unlocked = totalHours >= badge.hours;
            const Icon = getBadgeIcon(badge);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl text-center transition-all ${
                  unlocked
                    ? 'bg-primary-500/10 border border-primary-500/20'
                    : 'bg-coffee-800/30 border border-white/5'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${unlocked ? 'bg-primary-500/20' : 'bg-coffee-800'}`}>
                  {unlocked ? (
                    <Icon size={24} className="text-primary-300" />
                  ) : (
                    <Lock size={24} className="text-coffee-600" />
                  )}
                </div>
                <p className={`text-xs font-medium ${unlocked ? 'text-white' : 'text-coffee-500'}`}>{badge.name}</p>
                <p className={`text-[10px] ${unlocked ? 'text-primary-300' : 'text-coffee-600'}`}>{badge.hours}h</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
