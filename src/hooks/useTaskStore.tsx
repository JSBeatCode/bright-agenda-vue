import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Task, Priority, ViewMode } from '@/types/task';
import { format, startOfWeek, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekDatesFromDate(date: Date): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

interface TaskStore {
  tasks: Task[];
  viewMode: ViewMode;
  selectedDate: string;
  loading: boolean;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: string) => void;
  addTask: (title: string, priority: Priority, date: string, description?: string) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  reorderTasks: (taskId: string, targetId: string) => void;
  getTasksForDate: (date: string) => Task[];
  getWeekDates: () => string[];
  getAllActiveTasks: () => Task[];
}

const TaskContext = createContext<TaskStore | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error('일정을 불러오는데 실패했습니다');
          console.error(error);
        } else {
          setTasks((data || []).map(t => ({
            id: t.id,
            title: t.title,
            description: t.description ?? undefined,
            priority: t.priority as Priority,
            completed: t.completed,
            date: t.date,
            order: t.order,
          })));
        }
        setLoading(false);
      });
  }, [user]);

  const addTask = useCallback(async (title: string, priority: Priority, date: string, description?: string) => {
    if (!user) return;
    const maxOrder = tasks.filter(t => t.date === date).reduce((max, t) => Math.max(max, t.order), -1);
    const newOrder = maxOrder + 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, description, priority, date, order: newOrder, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('일정 추가에 실패했습니다');
      console.error(error);
      return;
    }

    setTasks(prev => [...prev, {
      id: data.id,
      title: data.title,
      description: data.description ?? undefined,
      priority: data.priority as Priority,
      completed: data.completed,
      date: data.date,
      order: data.order,
    }]);
  }, [user, tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id'>>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toast.error('수정에 실패했습니다');
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error('삭제에 실패했습니다');
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
    if (error) {
      toast.error('상태 변경에 실패했습니다');
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, [tasks]);

  const reorderTasks = useCallback(async (taskId: string, targetId: string) => {
    setTasks(prev => {
      const newTasks = [...prev];
      const dragIdx = newTasks.findIndex(t => t.id === taskId);
      const dropIdx = newTasks.findIndex(t => t.id === targetId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      const [moved] = newTasks.splice(dragIdx, 1);
      newTasks.splice(dropIdx, 0, moved);
      const date = moved.date;
      let order = 0;
      const updated = newTasks.map(t => t.date === date ? { ...t, order: order++ } : t);

      // Update orders in DB (fire and forget)
      const dateTasks = updated.filter(t => t.date === date);
      dateTasks.forEach(t => {
        supabase.from('tasks').update({ order: t.order }).eq('id', t.id).then();
      });

      return updated;
    });
  }, []);

  const getTasksForDate = useCallback((date: string) => {
    return tasks.filter(t => t.date === date).sort((a, b) => a.order - b.order);
  }, [tasks]);

  const getWeekDatesArr = useCallback(() => {
    return getWeekDatesFromDate(new Date(selectedDate));
  }, [selectedDate]);

  const getAllActiveTasks = useCallback(() => {
    return [...tasks].filter(t => !t.completed).sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [tasks]);

  return (
    <TaskContext.Provider value={{
      tasks, viewMode, selectedDate, loading, setViewMode, setSelectedDate,
      addTask, updateTask, deleteTask, toggleComplete, reorderTasks,
      getTasksForDate, getWeekDates: getWeekDatesArr, getAllActiveTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskStore() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskStore must be used within TaskProvider');
  return ctx;
}
