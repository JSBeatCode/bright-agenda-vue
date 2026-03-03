import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, Priority, ViewMode } from '@/types/task';
import { format, startOfWeek, addDays } from 'date-fns';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekDates(date: Date): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

interface TaskStore {
  tasks: Task[];
  viewMode: ViewMode;
  selectedDate: string;
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

const INITIAL_TASKS: Task[] = [
  { id: generateId(), title: '주간 보고서 작성', priority: 'high', completed: false, date: getToday(), order: 0 },
  { id: generateId(), title: '팀 미팅 자료 준비', priority: 'medium', completed: false, date: getToday(), order: 1 },
  { id: generateId(), title: '이메일 정리', priority: 'low', completed: false, date: getToday(), order: 2 },
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(getToday());

  const addTask = useCallback((title: string, priority: Priority, date: string, description?: string) => {
    const maxOrder = tasks.filter(t => t.date === date).reduce((max, t) => Math.max(max, t.order), -1);
    setTasks(prev => [...prev, {
      id: generateId(),
      title,
      description,
      priority,
      completed: false,
      date,
      order: maxOrder + 1,
    }]);
  }, [tasks]);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id'>>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const reorderTasks = useCallback((taskId: string, targetId: string) => {
    setTasks(prev => {
      const newTasks = [...prev];
      const dragIdx = newTasks.findIndex(t => t.id === taskId);
      const dropIdx = newTasks.findIndex(t => t.id === targetId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      const [moved] = newTasks.splice(dragIdx, 1);
      newTasks.splice(dropIdx, 0, moved);
      // Reassign order for same-date tasks
      const date = moved.date;
      let order = 0;
      return newTasks.map(t => t.date === date ? { ...t, order: order++ } : t);
    });
  }, []);

  const getTasksForDate = useCallback((date: string) => {
    return tasks.filter(t => t.date === date).sort((a, b) => a.order - b.order);
  }, [tasks]);

  const getWeekDatesArr = useCallback(() => {
    return getWeekDates(new Date(selectedDate));
  }, [selectedDate]);

  const getAllActiveTasks = useCallback(() => {
    return [...tasks].filter(t => !t.completed).sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [tasks]);

  return (
    <TaskContext.Provider value={{
      tasks, viewMode, selectedDate, setViewMode, setSelectedDate,
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
