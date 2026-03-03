export type Priority = 'high' | 'medium' | 'low';

export type ViewMode = 'daily' | 'weekly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  date: string; // YYYY-MM-DD
  order: number;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '긴급',
  medium: '보통',
  low: '낮음',
};

export const WEEKDAYS = ['월', '화', '수', '목', '금'] as const;
