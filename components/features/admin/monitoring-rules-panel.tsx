'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconAlertTriangle,
  IconBellRinging,
  IconRefresh,
  IconShieldLock,
} from '@tabler/icons-react';

type Rule = {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  channel: 'email' | 'slack' | 'sms';
  enabled: boolean;
  notes?: string;
};

const initialRules: Rule[] = [
  {
    id: 'cpu-spike',
    name: 'CPU Spike',
    metric: 'cpu_usage',
    threshold: 82,
    severity: 'warning',
    channel: 'slack',
    enabled: true,
    notes: 'Alert when CPU exceeds sustained average for 5 minutes.',
  },
  {
    id: 'error-rate',
    name: 'API Error Rate',
    metric: 'http_error_rate',
    threshold: 2.5,
    severity: 'critical',
    channel: 'email',
    enabled: true,
    notes: 'Critical if >2.5% across all regions.',
  },
  {
    id: 'db-latency',
    name: 'DB Latency Drift',
    metric: 'db_response_time',
    threshold: 180,
    severity: 'warning',
    channel: 'sms',
    enabled: false,
    notes: 'Notify on-call if p95 latency exceeds baseline.',
  },
];

const channelLabels: Record<Rule['channel'], string> = {
  email: 'Email',
  slack: 'Slack',
  sms: 'SMS',
};

const severityStyles: Record<Rule['severity'], string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function MonitoringRulesPanel() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Rule>({
    id: 'new-rule',
    name: '',
    metric: 'cpu_usage',
    threshold: 80,
    severity: 'warning',
    channel: 'slack',
    enabled: true,
    notes: '',
  });

  const complianceScore = useMemo(() => {
    const enabled = rules.filter((rule) => rule.enabled).length;
    return Math.round((enabled / Math.max(rules.length, 1)) * 100);
  }, [rules]);

  const toggleRule = (id: string, enabled: boolean) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              enabled,
            }
          : rule
      )
    );
  };

  const updateThreshold = (id: string, threshold: number) => {
    if (Number.isNaN(threshold)) return;
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              threshold,
            }
          : rule
      )
    );
  };

  const createRule = () => {
    if (!formState.name.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setRules((prev) => [
        {
          ...formState,
          id: `${formState.metric}-${Date.now()}`,
        },
        ...prev,
      ]);
      setFormState({
        id: 'new-rule',
        name: '',
        metric: 'cpu_usage',
        threshold: 80,
        severity: 'warning',
        channel: 'slack',
        enabled: true,
        notes: '',
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Monitoring Rules Engine
          </h1>
          <p className="text-muted-foreground">
            Fine-tune alert policies, escalation targets, and automation hooks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-hunks-green/10 text-hunks-green border-hunks-green/30">
            {complianceScore}% Coverage
          </Badge>
          <Button variant="outline" size="sm">
            <IconRefresh className="h-4 w-4" />
            Sync with PagerDuty
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Rules</CardDescription>
            <CardTitle className="text-2xl">{rules.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {rules.filter((rule) => rule.enabled).length} live policies
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Coverage</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {rules.filter((rule) => rule.severity === 'critical').length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            High urgency escalation paths
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Automation Hooks</CardDescription>
            <CardTitle className="text-2xl">
              {rules.filter((rule) => rule.channel === 'slack').length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Slack + AI assistant actions
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Score</CardDescription>
            <CardTitle className="text-2xl">{complianceScore}%</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on enabled vs total rules
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader>
            <CardTitle>Create Automation Rule</CardTitle>
            <CardDescription>
              Define triggers, severity, and notification channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                placeholder="e.g. Worker Memory Leak"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Metric</label>
                <Input
                  value={formState.metric}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      metric: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Threshold</label>
                <Input
                  type="number"
                  min={0}
                  value={formState.threshold}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      threshold: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formState.severity}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      severity: event.target.value as Rule['severity'],
                    }))
                  }
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formState.channel}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      channel: event.target.value as Rule['channel'],
                    }))
                  }
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                rows={3}
                placeholder="Optional context, runbooks, or auto-remediation steps"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formState.enabled}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      enabled: checked,
                    }))
                  }
                />
                <span>Rule enabled</span>
              </div>
              <Button onClick={createRule} disabled={isSubmitting}>
                <IconBellRinging className="h-4 w-4" />
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle>Escalation Blueprint</CardTitle>
            <CardDescription>
              Describe how automation should react to alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-md border border-dashed p-3">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Trigger PagerDuty for critical rule breaches
            </div>
            <div className="flex items-center gap-3 rounded-md border border-dashed p-3">
              <IconShieldLock className="h-5 w-5 text-hunks-green" />
              Auto-roll back risky deployments when database latency spikes
            </div>
            <div className="flex items-center gap-3 rounded-md border border-dashed p-3">
              <IconBellRinging className="h-5 w-5 text-amber-500" />
              Notify analytics channel with context-rich incident cards
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Policies</CardTitle>
          <CardDescription>
            Adjust thresholds or toggle automation per rule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rule.metric}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-10 w-24"
                      value={rule.threshold}
                      onChange={(event) =>
                        updateThreshold(rule.id, Number(event.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge className={severityStyles[rule.severity]}>
                      {rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{channelLabels[rule.channel]}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        toggleRule(rule.id, checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
