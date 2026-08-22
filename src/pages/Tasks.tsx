import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { coinsForTask } from '@/lib/constants';
import type { Task } from '@/lib/types';
import { Plus, Check, Trash2, ListTodo, Coins } from 'lucide-react';

export default function Tasks() {
  const { user, profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTasks(data as Task[] ?? []);
    })();
  }, [user]);

  async function addTask() {
    if (!user || !newTitle.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, title: newTitle.trim() })
      .select()
      .single();
    if (data) {
      setTasks([data as Task, ...tasks]);
      setNewTitle('');
    }
    setLoading(false);
  }

async function toggleTask(task: Task) {
    if (!user || !profile) return;

    if (!task.done) {
      // Marking complete: the database awards the coins (see complete_task in
      // the migrations) so completing/un-completing repeatedly can't be used
      // to farm coins, and the reward always matches coinsForTask() server-side.
      const { error } = await supabase.rpc('complete_task', { p_task_id: task.id });
      if (error) {
        console.error('Failed to complete task:', error.message);
        return;
      }
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: true } : t)));
      await refreshProfile();
      return;
    }

    // Un-completing doesn't touch coins, so a plain update is fine here.
    const { data } = await supabase
      .from('tasks')
      .update({ done: false })
      .eq('id', task.id)
      .select()
      .single();
    if (data) {
      const updated = data as Task;
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    }
  }

  async function deleteTask(task: Task) {
    await supabase.from('tasks').delete().eq('id', task.id);
    setTasks(tasks.filter((t) => t.id !== task.id));
  }

  const activeTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-300">
          <ListTodo size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">To-Do List</h1>
          <p className="text-sm text-coffee-400">Complete your daily goals</p>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          className="flex-1 px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50 transition-all"
        />
        <button
          onClick={addTask}
          disabled={loading || !newTitle.trim()}
          className="px-4 rounded-xl bg-[#f1d6b9] text-coffee-900 flex items-center justify-center hover:brightness-95 active:scale-95 transition-all disabled:opacity-40"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Active tasks */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3">
          Active · {activeTasks.length}
        </p>
        {activeTasks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-coffee-400">No active tasks. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="glass-card px-4 py-3.5 flex items-center gap-3 group animate-slide-up hover:border-primary-500/20 transition-all"
              >
                <button
                  onClick={() => toggleTask(task)}
                  className="w-6 h-6 rounded-full border-2 border-coffee-600 hover:border-primary-400 transition-all flex items-center justify-center shrink-0"
                />
                <span className="flex-1 text-sm text-white">{task.title}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 shrink-0">
                  <Coins size={12} /> +{coinsForTask()}
                </span>
                <button
                  onClick={() => deleteTask(task)}
                  className="text-coffee-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3">
            Completed · {completedTasks.length}
          </p>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="glass-card px-4 py-3.5 flex items-center gap-3 group opacity-60"
              >
                <button
                  onClick={() => toggleTask(task)}
                  className="w-6 h-6 rounded-full bg-[#f1d6b9] flex items-center justify-center shrink-0"
                >
                  <Check size={14} className="text-coffee-900" strokeWidth={3} />
                </button>
                <span className="flex-1 text-sm text-coffee-400 line-through">{task.title}</span>
                <button
                  onClick={() => deleteTask(task)}
                  className="text-coffee-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
