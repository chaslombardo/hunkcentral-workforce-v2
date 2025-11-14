import { SmartBreadcrumbsDemo } from '@/components/layout/smart-breadcrumbs-demo';

export const dynamic = 'force-dynamic';

export default function BreadcrumbsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
            Navigation Breadcrumbs
          </h1>
          <p className="text-muted-foreground">
            Smart breadcrumb navigation system for improved user experience.
          </p>
        </div>
        <div className="flex justify-center">
          <SmartBreadcrumbsDemo />
        </div>
      </div>
    </div>
  );
}
