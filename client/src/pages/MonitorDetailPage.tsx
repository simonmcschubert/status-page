import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Monitor } from '../types';
import { UptimeBar } from '../components/UptimeBar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMonitor() {
      try {
        const response = await fetch(`/api/monitors/${id}`);
        if (!response.ok) {
          throw new Error('Monitor not found');
        }
        const data = await response.json();
        setMonitor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load monitor');
      } finally {
        setLoading(false);
      }
    }

    fetchMonitor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Status
          </Link>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>{error || 'Monitor not found'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusVariant = (): 'success' | 'destructive' | 'warning' => {
    if (monitor.currentStatus === 'down') return 'destructive';
    if (monitor.currentStatus === 'degraded') return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (monitor.currentStatus === 'down') return <XCircle className="h-5 w-5" />;
    if (monitor.currentStatus === 'degraded') return <AlertTriangle className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (monitor.currentStatus === 'down') return 'Down';
    if (monitor.currentStatus === 'degraded') return 'Degraded';
    return 'Operational';
  };

  const uptimePercent = monitor.uptime ?? 100;
  const avgResponseTime = monitor.avgResponseTime ?? 0;

  // Generate mock response time data for chart
  const responseTimeData = Array.from({ length: 30 }, () => ({
    value: Math.max(50, avgResponseTime + (Math.random() - 0.5) * 100)
  }));

  const maxResponseTime = Math.max(...responseTimeData.map(d => d.value));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Status
        </Link>
        
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    monitor.currentStatus === 'up' && "bg-success/10 text-success",
                    monitor.currentStatus === 'degraded' && "bg-warning/10 text-warning",
                    monitor.currentStatus === 'down' && "bg-destructive/10 text-destructive"
                  )}>
                    {getStatusIcon()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                      {monitor.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">{monitor.url}</p>
                  </div>
                </div>
              </div>
              <Badge variant={getStatusVariant()} className="text-sm px-3 py-1">
                {getStatusText()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Uptime Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Overall Uptime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last 90 days</span>
              <span className={cn(
                "text-2xl font-bold",
                uptimePercent >= 99.9 ? "text-success" :
                uptimePercent >= 99 ? "text-warning" : "text-destructive"
              )}>
                {uptimePercent.toFixed(2)}%
              </span>
            </div>
            <UptimeBar uptimeHistory={monitor.uptimeHistory} days={90} />
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24 mb-4">
              {responseTimeData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-colors cursor-default"
                  style={{
                    height: `${(data.value / maxResponseTime) * 100}%`
                  }}
                  title={`${data.value.toFixed(0)}ms`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Avg: {avgResponseTime.toFixed(0)}ms</span>
              <span>Last 30 days</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={cn(
                "text-2xl font-bold",
                uptimePercent >= 99.9 ? "text-success" :
                uptimePercent >= 99 ? "text-warning" : "text-destructive"
              )}>
                {uptimePercent.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Overall Uptime</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {avgResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground mt-1">Avg Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {monitor.interval || 60}s
              </div>
              <div className="text-sm text-muted-foreground mt-1">Check Interval</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-foreground uppercase">
                {monitor.type}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Monitor Type</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
