import { useState } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { PRIORITY_LABELS } from '@/types/task';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function RightPanel() {
  const { getAllActiveTasks } = useTaskStore();
  const [collapsed, setCollapsed] = useState(false);
  const tasks = getAllActiveTasks();

  return (
    <div className={cn(
      "border-l border-border flex flex-col bg-secondary/30 transition-all duration-200 shrink-0",
      collapsed ? "w-12" : "w-64"
    )}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <h2 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">우선순위</h2>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 font-mono">등록된 일정 없음</p>
          )}
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className="flex items-start gap-2 px-2.5 py-2 rounded border border-border bg-card text-sm animate-slide-in"
            >
              <span className="font-mono text-[10px] text-muted-foreground mt-0.5 shrink-0 w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[9px] font-mono tracking-wider uppercase",
                    task.priority === 'high' ? "font-bold" : "text-muted-foreground"
                  )}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {format(parseISO(task.date), 'M/d', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="p-3 border-t border-border">
          <p className="text-[10px] font-mono text-muted-foreground">
            총 <span className="text-foreground font-semibold">{tasks.length}</span>개 미완료
          </p>
        </div>
      )}
    </div>
  );
}
