'use client';

import { useMemo, useState } from 'react';
import { IconGauge, IconTrendingUp, IconWaveSine } from '@tabler/icons-react';

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
import { Textarea } from '@/components/ui/textarea';

type Scenario = {
  id: string;
  label: string;
  cpu: number;
  memory: number;
  queryLatency: number;
};

const scenarioPresets: Scenario[] = [
  { id: 'baseline', label: 'Baseline', cpu: 48, memory: 62, queryLatency: 120 },
  { id: 'promo', label: 'Promo Surge', cpu: 78, memory: 85, queryLatency: 210 },
  {
    id: 'nightly',
    label: 'Nightly Jobs',
    cpu: 65,
    memory: 70,
    queryLatency: 320,
  },
];

export function PerformanceStudio() {
  const [scenario, setScenario] = useState<Scenario>(scenarioPresets[0]);
  const [targetLatency, setTargetLatency] = useState(150);
  const [notes, setNotes] = useState(
    'Shift outreach campaigns to earlier hours to free compute for payroll merges.'
  );

  const healthScore = useMemo(() => {
    const cpuWeight = 0.4;
    const memoryWeight = 0.3;
    const latencyWeight = 0.3;
    const normalizedLatency = Math.max(0, 100 - scenario.queryLatency / 4);
    const score =
      cpuWeight * (100 - scenario.cpu) +
      memoryWeight * (100 - scenario.memory) +
      latencyWeight * normalizedLatency;
    return Math.round(score);
  }, [scenario]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Studio
          </h1>
          <p className="text-muted-foreground">
            Run what-if scenarios, tweak SLAs, and capture mitigation notes.
          </p>
        </div>
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Current score: {healthScore}%
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarioPresets.map((preset) => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-all ${
              preset.id === scenario.id
                ? 'border-hunks-green shadow-lg'
                : 'hover:border-hunks-green/40'
            }`}
            onClick={() => setScenario(preset)}
          >
            <CardHeader className="pb-2">
              <CardDescription>Scenario</CardDescription>
              <CardTitle className="text-xl">{preset.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div>CPU Load: {preset.cpu}%</div>
              <div>Memory: {preset.memory}%</div>
              <div>DB p95: {preset.queryLatency}ms</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Envelope</CardTitle>
            <CardDescription>Fine-tune dynamic scaling bounds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">CPU Ceiling</p>
                <p className="text-3xl font-bold text-hunks-green">
                  {scenario.cpu}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Memory Ceiling</p>
                <p className="text-3xl font-bold text-hunks-orange">
                  {scenario.memory}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Latency (ms)</label>
              <Input
                type="number"
                min={50}
                value={targetLatency}
                onChange={(event) =>
                  setTargetLatency(Number(event.target.value))
                }
              />
            </div>
            <Button className="w-full" variant="outline">
              <IconGauge className="h-4 w-4" />
              Recalculate guardrails
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitigation Notes</CardTitle>
            <CardDescription>
              Document what should happen if metrics breach.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button className="w-full">
              <IconTrendingUp className="h-4 w-4" />
              Save runbook excerpt
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signal Breakdown</CardTitle>
          <CardDescription>
            How this scenario impacts key experience metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconWaveSine className="h-4 w-4 text-hunks-green" />
              Page Load
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {(scenario.queryLatency / 100).toFixed(2)}s
            </p>
            <p className="text-xs text-muted-foreground">
              target {targetLatency / 100}s
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconTrendingUp className="h-4 w-4 text-blue-600" />
              Error Rate Impact
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {(scenario.cpu / 20).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Projected API errors
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconTrendingUp className="h-4 w-4 text-purple-600" />
              Cost Delta
            </div>
            <p className="mt-2 text-3xl font-semibold">
              ${(scenario.memory * 1.2).toFixed(0)}
              <span className="text-sm text-muted-foreground">/hr</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Additional autoscale spend
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
