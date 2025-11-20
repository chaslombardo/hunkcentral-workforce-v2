import { Metadata } from 'next';

import { AnalyticsCustomizationPanel } from '@/components/features/admin/analytics-customization-panel';

export const metadata: Metadata = {
  title: 'Analytics Settings | HUNKCentral',
  description: 'Customize analytics modules, palettes, and saved presets.',
};

export default function AnalyticsSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <AnalyticsCustomizationPanel />
    </div>
  );
}
