'use client';

import { useMemo, useState } from 'react';
import { IconLayoutDashboard, IconSparkles } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type ModuleToggle = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

const baseModules: ModuleToggle[] = [
  {
    id: 'conversion',
    title: 'Conversion Funnels',
    description: 'Visualize drop-off across onboarding and scheduling screens.',
    enabled: true,
  },
  {
    id: 'retention',
    title: 'Retention Cohorts',
    description: 'Weekly retention and reactivation cohorts.',
    enabled: false,
  },
  {
    id: 'heatmaps',
    title: 'Interaction Heatmaps',
    description: 'Aggregate clicks, scroll depth, and rage-taps.',
    enabled: true,
  },
  {
    id: 'forecasting',
    title: 'Forecasting',
    description: 'AI-assisted projections for revenue and staffing.',
    enabled: true,
  },
];

const palettePresets = [
  { id: 'hunks', name: 'Hunks Classic', accent: '#026937' },
  { id: 'midnight', name: 'Midnight Ops', accent: '#0f172a' },
  { id: 'sunrise', name: 'Sunrise Metrics', accent: '#ea7200' },
];

export function AnalyticsCustomizationPanel() {
  const [modules, setModules] = useState(baseModules);
  const [activePalette, setActivePalette] = useState(palettePresets[0].id);
  const [favoriteMetric, setFavoriteMetric] = useState('Revenue per Captain');
  const [notes, setNotes] = useState(
    'Punch out widgets you rarely use, and promote ones you obsess over.'
  );

  const enabledCount = useMemo(
    () => modules.filter((module) => module.enabled).length,
    [modules]
  );

  const toggleModule = (id: string, enabled: boolean) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === id
          ? {
              ...module,
              enabled,
            }
          : module
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Customization Studio
          </h1>
          <p className="text-muted-foreground">
            Activate specialist modules, tweak palettes, and save dashboard
            presets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-hunks-green/10 text-hunks-green border-hunks-green/20">
            {enabledCount}/{modules.length} modules
          </Badge>
          <Button variant="outline" size="sm">
            <IconLayoutDashboard className="h-4 w-4" />
            Preview layout
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Palettes</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Rotate seasonal themes for dashboard focus
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shared Presets</CardDescription>
            <CardTitle className="text-2xl">7</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Includes Ops, Finance, Field Leadership
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Insights</CardDescription>
            <CardTitle className="text-2xl">24</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Latest anomaly explanations from Copilot
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exports This Week</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            CSV, Looker, and Notion syncs
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Module Library</CardTitle>
            <CardDescription>
              Toggle advanced analytics blocks per workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">
                      {module.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {module.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={module.enabled}
                        onCheckedChange={(checked) =>
                          toggleModule(module.id, checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palette + Notes</CardTitle>
            <CardDescription>
              Personalize highlight colors and focus notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme Palette</label>
              <div className="grid gap-3">
                {palettePresets.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setActivePalette(palette.id)}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      activePalette === palette.id
                        ? 'border-hunks-green bg-hunks-green/5'
                        : 'border-muted'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: palette.accent }}
                    />
                    <span>{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Favorite Metric</label>
              <Input
                value={favoriteMetric}
                onChange={(event) => setFavoriteMetric(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pinned Note</label>
              <Textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button className="w-full">
              <IconSparkles className="h-4 w-4" />
              Save preset
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
