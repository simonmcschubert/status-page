import { useMemo } from 'react';
import { cn } from '../lib/utils';

interface UptimeBarProps {
  uptimeHistory?: { date: string; uptime: number }[];
  days?: number;
  className?: string;
}

interface DayData {
  date: string;
  uptime: number;
  status: 'up' | 'degraded' | 'down' | 'no-data';
}

export function UptimeBar({ uptimeHistory, days = 90, className }: UptimeBarProps) {
  const barData = useMemo((): DayData[] => {
    // Generate the last N days
    const result: DayData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching history data
      const historyEntry = uptimeHistory?.find(h => h.date === dateStr);
      
      if (historyEntry) {
        let status: 'up' | 'degraded' | 'down' = 'up';
        if (historyEntry.uptime < 99) status = 'degraded';
        if (historyEntry.uptime < 90) status = 'down';
        
        result.push({
          date: dateStr,
          uptime: historyEntry.uptime,
          status
        });
      } else {
        // No data for this day - assume up or show as no-data
        result.push({
          date: dateStr,
          uptime: 100,
          status: 'up'
        });
      }
    }
    
    return result;
  }, [uptimeHistory, days]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn("flex items-center gap-[2px] h-8", className)}>
      {barData.map((day) => (
        <div
          key={day.date}
          className={cn(
            "flex-1 rounded-sm transition-all hover:opacity-80 cursor-pointer min-w-[2px]",
            day.status === 'up' && "bg-green-500",
            day.status === 'degraded' && "bg-yellow-500",
            day.status === 'down' && "bg-red-500",
            day.status === 'no-data' && "bg-muted h-1/3"
          )}
          style={{ height: day.status === 'no-data' ? '33%' : '100%' }}
          title={`${formatDate(day.date)}: ${day.uptime.toFixed(2)}%`}
        />
      ))}
    </div>
  );
}
