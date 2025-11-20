import { Metadata } from 'next';

import { PerformanceStudio } from '@/components/features/admin/performance-studio';

export const metadata: Metadata = {
  title: 'Performance Studio | HUNKCentral',
  description:
    'Interactive what-if modeling for compute, latency, and runbooks.',
};

export default function PerformanceStudioPage() {
  return (
    <div className="container mx-auto py-6">
      <PerformanceStudio />
    </div>
  );
}
