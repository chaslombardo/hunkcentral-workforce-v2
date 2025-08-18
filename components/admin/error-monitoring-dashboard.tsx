'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Bug, 
  Database, 
  Shield, 
  Server, 
  Smartphone, 
  ChevronDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ErrorReport } from '@/lib/error-reporting';

interface ErrorStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  byType: Record<string, number>;
  byComponent: Record<string, number>;
  trend: 'up' | 'down' | 'stable';
}

interface ErrorMonitoringDashboardProps {
  errors: ErrorReport[];
  stats: ErrorStats;
  onRefresh?: () => void;
  onResolveError?: (errorId: string, resolution: string) => void;
}

export function ErrorMonitoringDashboard({
  errors,
  stats,
  onRefresh,
  onResolveError,
}: ErrorMonitoringDashboardProps) {
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low' | 'unresolved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ErrorReport['type']>('all');

  const filteredErrors = errors.filter(error => {
    if (filter !== 'all') {
      if (filter === 'unresolved' && error.resolved) return false;
      if (filter !== 'unresolved' && error.level !== filter) return false;
    }
    if (typeFilter !== 'all' && error.type !== typeFilter) return false;
    return true;
  });

  const getLevelColor = (level: ErrorReport['level']) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: ErrorReport['type']) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'client': return <Smartphone className="h-4 w-4" />;
      case 'component': return <Bug className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            {stats.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.resolved} resolved ({Math.round((stats.resolved / stats.total) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
            <p className="text-xs text-muted-foreground">
              Need prompt resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((stats.resolved / stats.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Errors resolved successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      <Tabs defaultValue="errors" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="errors">Error List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {(['all', 'critical', 'high', 'medium', 'low', 'unresolved'] as const).map((level) => (
                <Button
                  key={level}
                  variant={filter === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(level)}
                >
                  {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {(['all', 'client', 'server', 'database', 'auth', 'component', 'network'] as const).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Error List */}
          <Card>
            <CardHeader>
              <CardTitle>Error Reports ({filteredErrors.length})</CardTitle>
              <CardDescription>
                Click on an error to view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredErrors.map((error) => (
                    <TableRow
                      key={error.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedError(error)}
                    >
                      <TableCell>
                        <Badge variant={getLevelColor(error.level)}>
                          {error.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(error.type)}
                          {error.type}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {error.message}
                      </TableCell>
                      <TableCell>{error.context.component}</TableCell>
                      <TableCell>
                        {new Date(error.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {error.resolved ? (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Open
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Errors by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type as ErrorReport['type'])}
                        <span className="capitalize">{type}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Errors by Component */}
            <Card>
              <CardHeader>
                <CardTitle>Top Components with Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byComponent)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([component, count]) => (
                      <div key={component} className="flex items-center justify-between">
                        <span className="truncate">{component}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Detail Modal */}
      {selectedError && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon(selectedError.type)}
                Error Details
                <Badge variant={getLevelColor(selectedError.level)}>
                  {selectedError.level}
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedError(null)}
              >
                Close
              </Button>
            </div>
            <CardDescription>
              Error ID: {selectedError.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Type:</strong> {selectedError.type}</div>
                  <div><strong>Component:</strong> {selectedError.context.component}</div>
                  <div><strong>Action:</strong> {selectedError.context.action}</div>
                  <div><strong>Timestamp:</strong> {new Date(selectedError.timestamp).toLocaleString()}</div>
                  <div><strong>Environment:</strong> {selectedError.context.environment}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Context</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>URL:</strong> {selectedError.context.url}</div>
                  <div><strong>User ID:</strong> {selectedError.context.userId || 'Anonymous'}</div>
                  <div><strong>User Agent:</strong> {selectedError.context.userAgent || 'Unknown'}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Error Message</h4>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{selectedError.message}</AlertDescription>
              </Alert>
            </div>

            {selectedError.stack && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Stack Trace
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="text-xs font-mono bg-muted p-4 rounded border max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{selectedError.stack}</pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {selectedError.context.metadata && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Metadata
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="text-xs font-mono bg-muted p-4 rounded border max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedError.context.metadata, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {!selectedError.resolved && onResolveError && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onResolveError(selectedError.id, 'Manually resolved by admin');
                    setSelectedError(null);
                  }}
                  className="flex-1"
                >
                  Mark as Resolved
                </Button>
              </div>
            )}

            {selectedError.resolution && (
              <div>
                <h4 className="font-semibold mb-2">Resolution</h4>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-sm">
                    <div><strong>Resolved by:</strong> {selectedError.resolution.resolvedBy}</div>
                    <div><strong>Resolved at:</strong> {new Date(selectedError.resolution.resolvedAt).toLocaleString()}</div>
                    <div><strong>Resolution:</strong> {selectedError.resolution.resolution}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}