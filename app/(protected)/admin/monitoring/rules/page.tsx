import { Metadata } from 'next';

import { MonitoringRulesPanel } from '@/components/features/admin/monitoring-rules-panel';

export const metadata: Metadata = {
  title: 'Monitoring Rules | HUNKCentral',
  description:
    'Configure alerting policies, escalation rules, and automation hooks.',
};

export default function MonitoringRulesPage() {
  return (
    <div className="container mx-auto py-6">
      <MonitoringRulesPanel />
    </div>
  );
}
