'use client';

import * as React from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, BarChart3, Clock, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
  className?: string;
}

export function PerformanceMonitor({ 
  showInProduction = false 
}: PerformanceMonitorProps) {
  const [stats, setStats] = React.useState<Record<string, ReturnType<typeof performanceMonitor.getStats>>>({});
  const [isVisible, setIsVisible] = React.useState(false);

  // Only show in development unless explicitly enabled for production
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  React.useEffect(() => {
    if (!shouldShow) return;

    const updateStats = () => {
      setStats(performanceMonitor.getAllStats());
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, [shouldShow]);

  if (!shouldShow) return null;

  const sortedStats = Object.entries(stats)
    .filter(([, stat]) => stat !== null)
    .sort(([, a], [, b]) => (b?.average || 0) - (a?.average || 0));

  const totalComponents = sortedStats.length;
  const averageRenderTime = sortedStats.length > 0 
    ? sortedStats.reduce((acc, [, stat]) => acc + (stat?.average || 0), 0) / sortedStats.length
    : 0;

  const slowComponents = sortedStats.filter(([, stat]) => (stat?.average || 0) > 10);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
        {slowComponents.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {slowComponents.length}
          </Badge>
        )}
      </Button>

      {/* Performance Panel */}
      {isVisible && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-96 overflow-auto shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>
              Component render performance statistics
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-semibold">{totalComponents}</div>
                <div className="text-muted-foreground">Components</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averageRenderTime.toFixed(1)}ms</div>
                <div className="text-muted-foreground">Avg Render</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-destructive">{slowComponents.length}</div>
                <div className="text-muted-foreground">Slow (&gt;10ms)</div>
              </div>
            </div>

            <Separator />

            {/* Component List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedStats.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No performance data available
                </div>
              ) : (
                sortedStats.map(([componentName, stat]) => (
                  <div key={componentName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate font-medium">{componentName}</span>
                      {(stat?.average || 0) > 10 && (
                        <Zap className="h-3 w-3 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stat?.count} renders</span>
                      <Badge 
                        variant={(stat?.average || 0) > 10 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {stat?.average.toFixed(1)}ms
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => performanceMonitor.logStats()}
                className="flex-1"
              >
                Log to Console
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  performanceMonitor.clear();
                  setStats({});
                }}
                className="flex-1"
              >
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/**
 * Hook for monitoring a specific component's performance
 */
export function useComponentPerformance(componentName: string) {
  const [renderCount, setRenderCount] = React.useState(0);
  const [lastRenderTime, setLastRenderTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    const stats = performanceMonitor.getStats(componentName);
    if (stats) {
      setLastRenderTime(stats.recent);
    }
  }, [componentName]);

  return {
    renderCount,
    lastRenderTime,
    stats: performanceMonitor.getStats(componentName),
  };
}

/**
 * Development-only performance warning component
 */
export function PerformanceWarning({ 
  componentName, 
  threshold = 10 
}: { 
  componentName: string; 
  threshold?: number; 
}) {
  const stats = performanceMonitor.getStats(componentName);
  
  if (process.env.NODE_ENV !== 'development') return null;
  if (!stats || stats.average <= threshold) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground p-2 rounded text-sm shadow-lg">
      ⚠️ {componentName} is slow ({stats.average.toFixed(1)}ms avg)
    </div>
  );
}

export default PerformanceMonitor;