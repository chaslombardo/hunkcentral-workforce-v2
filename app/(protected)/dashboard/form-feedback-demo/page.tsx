import { FormFeedbackDemo } from '@/components/forms/form-feedback-demo';

export default function FormFeedbackPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">Form Feedback System</h1>
        <p className="text-muted-foreground">
          Enhanced form feedback components with branded styling, animations, and comprehensive error handling.
        </p>
      </div>
      <FormFeedbackDemo />
    </div>
  );
}