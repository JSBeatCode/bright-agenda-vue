import { useState, useRef } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Task, Priority, PRIORITY_LABELS } from '@/types/task';
import { Plus, GripVertical, Trash2, Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

function TaskItem({ task, onDragStart, onDragOver, onDrop }: {
  task: Task;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
}) {
  const { toggleComplete, deleteTask, updateTask } = useTaskStore();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDrop={() => onDrop(task.id)}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 border border-border rounded bg-card hover:bg-accent/50 transition-all animate-slide-in cursor-grab active:cursor-grabbing",
        task.completed && "opacity-40"
      )}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

      <button
        onClick={() => toggleComplete(task.id)}
        className={cn(
          "w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors",
          task.completed ? "bg-foreground border-foreground" : "border-muted-foreground hover:border-foreground"
        )}
      >
        {task.completed && <Check className="w-3 h-3 text-background" />}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-transparent text-sm outline-none border-b border-foreground py-0.5 font-sans"
          />
        ) : (
          <span className={cn("text-sm block truncate", task.completed && "line-through")}>{task.title}</span>
        )}
      </div>

      <span className={cn(
        "text-[10px] font-mono tracking-wider uppercase shrink-0",
        task.priority === 'high' && "text-foreground font-semibold",
        task.priority === 'medium' && "text-muted-foreground",
        task.priority === 'low' && "text-muted-foreground/60",
      )}>
        {PRIORITY_LABELS[task.priority]}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setEditing(true); setEditTitle(task.title); }} className="p-1 rounded hover:bg-accent">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-accent">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({ date, onClose }: { date: string; onClose: () => void }) {
  const { addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), priority, date);
    setTitle('');
    inputRef.current?.focus();
  };

  const priorities: Priority[] = ['high', 'medium', 'low'];

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border border-border rounded bg-card animate-slide-in">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="할 일 입력..."
        autoFocus
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-sans px-1"
      />
      <div className="flex gap-1">
        {priorities.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
              priority === p ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"
            )}
          >
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>
      <button type="submit" className="p-1 rounded hover:bg-accent">
        <Plus className="w-4 h-4" />
      </button>
      <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
        <X className="w-4 h-4" />
      </button>
    </form>
  );
}

function DayColumn({ date }: { date: string }) {
  const { getTasksForDate, reorderTasks } = useTaskStore();
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const tasks = getTasksForDate(date);

  const formatted = format(parseISO(date), 'M/d (EEE)', { locale: ko });
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn(
          "font-mono text-xs tracking-wider uppercase",
          isToday ? "text-foreground font-bold" : "text-muted-foreground"
        )}>
          {formatted}
          {isToday && <span className="ml-2 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded font-mono">오늘</span>}
        </h3>
        <button onClick={() => setShowAdd(true)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onDragStart={setDragId}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(targetId) => {
              if (dragId && dragId !== targetId) reorderTasks(dragId, targetId);
              setDragId(null);
            }}
          />
        ))}
        {tasks.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground py-4 text-center font-mono">할 일 없음</p>
        )}
        {showAdd && <AddTaskForm date={date} onClose={() => setShowAdd(false)} />}
      </div>
    </div>
  );
}

export function ContentArea() {
  const { viewMode, selectedDate, getWeekDates } = useTaskStore();

  if (viewMode === 'weekly') {
    const weekDates = getWeekDates();
    return (
      <div className="flex-1 overflow-auto p-6">
        <h1 className="font-mono text-lg font-bold mb-6 tracking-tight">주간 일정</h1>
        <div className="flex gap-4">
          {weekDates.map(date => (
            <DayColumn key={date} date={date} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="font-mono text-lg font-bold mb-6 tracking-tight">일일 일정</h1>
      <div className="max-w-lg">
        <DayColumn date={selectedDate} />
      </div>
    </div>
  );
}
