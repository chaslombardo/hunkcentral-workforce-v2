import { SmartInputDemo } from '@/components/forms/smart-input-demo';

export default function SmartInputPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">Smart Input Components</h1>
        <p className="text-muted-foreground">
          Intelligent input components with real-time validation and enhanced user experience.
        </p>
      </div>
      <SmartInputDemo />
    </div>
  );
}