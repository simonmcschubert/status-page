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
      
      if (historyEntry && historyEntry.uptime != null) {
        // Parse uptime as number in case it's a string
        const uptimeValue = typeof historyEntry.uptime === 'string' 
          ? parseFloat(historyEntry.uptime) 
          : historyEntry.uptime;
        
        // Handle NaN from parsing
        if (isNaN(uptimeValue)) {
          result.push({
            date: dateStr,
            uptime: 100,
            status: 'no-data'
          });
        } else {
          let status: 'up' | 'degraded' | 'down' = 'up';
          if (uptimeValue < 99) status = 'degraded';
          if (uptimeValue < 90) status = 'down';
          
          result.push({
            date: dateStr,
            uptime: uptimeValue,
            status
          });
        }
      } else {
        // No data for this day - show as no-data
        result.push({
          date: dateStr,
          uptime: 100,
          status: 'no-data'
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
            day.status === 'up' && "bg-success",
            day.status === 'degraded' && "bg-warning",
            day.status === 'down' && "bg-error",
            day.status === 'no-data' && "bg-[var(--color-no-data)] h-1/3"
          )}
          style={{ height: day.status === 'no-data' ? '33%' : '100%' }}
          title={`${formatDate(day.date)}: ${day.status === 'no-data' ? 'No data' : `${day.uptime.toFixed(2)}%`}`}
        />
      ))}
    </div>
  );
}
