import { useState } from 'react';
import { CalendarDays, Calendar, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function LeftSidebar() {
  const { viewMode, setViewMode } = useTaskStore();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { mode: 'daily' as const, label: '일일 일정', icon: Calendar },
    { mode: 'weekly' as const, label: '주간 일정', icon: CalendarDays },
  ];

  return (
    <div className={cn(
      "border-r border-border flex flex-col bg-secondary/30 transition-all duration-200 shrink-0",
      collapsed ? "w-12" : "w-56"
    )}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!collapsed && (
          <h2 className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">메뉴</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.mode}
            onClick={() => setViewMode(item.mode)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
              viewMode === item.mode
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-border space-y-2">
          {user && (
            <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}
