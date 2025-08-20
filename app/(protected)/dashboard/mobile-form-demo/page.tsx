import { MobileFormDemo } from '@/components/forms/mobile-form-demo';

export const dynamic = 'force-dynamic';

export default function MobileFormPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
          Mobile Form Components
        </h1>
        <p className="text-muted-foreground">
          Mobile-optimized form components with touch-friendly interactions and
          responsive design.
        </p>
      </div>
      <MobileFormDemo />
    </div>
  );
}
