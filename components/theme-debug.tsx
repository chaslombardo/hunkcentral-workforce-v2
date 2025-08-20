'use client';

import * as React from 'react';
import { useThemeDebug } from '@/hooks/useThemeDebug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface ThemeDebugProps {
  enabled?: boolean;
}

export function ThemeDebug({ enabled = false }: ThemeDebugProps) {
  const {
    mounted,
    theme,
    resolvedTheme,
    systemTheme,
    debugInfo,
    validateThemeConsistency,
    refreshTheme,
  } = useThemeDebug();

  if (!enabled || !mounted) return null;

  const { isConsistent, issues } = validateThemeConsistency();

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur-sm border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Theme Debug
          {isConsistent ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Theme:</span>
            <Badge variant="outline" className="ml-1">
              {theme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Resolved:</span>
            <Badge variant="outline" className="ml-1">
              {resolvedTheme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">System:</span>
            <Badge variant="outline" className="ml-1">
              {systemTheme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Stored:</span>
            <Badge variant="outline" className="ml-1">
              {debugInfo.storedTheme || 'null'}
            </Badge>
          </div>
        </div>

        <div>
          <span className="font-medium">Document Class:</span>
          <div className="text-muted-foreground break-all">
            {debugInfo.documentClass || 'none'}
          </div>
        </div>

        <div>
          <span className="font-medium">System Preference:</span>
          <Badge variant="outline" className="ml-1">
            {debugInfo.systemPreference}
          </Badge>
        </div>

        {issues.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium text-yellow-600">Issues:</span>
            {issues.map((issue, index) => (
              <div key={index} className="text-yellow-600 text-xs">
                • {issue}
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={refreshTheme}
          className="w-full"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Theme
        </Button>
      </CardContent>
    </Card>
  );
}
