import { MotionPreferencesDemo } from "@/components/demos/motion-preferences-demo"

export const dynamic = 'force-dynamic'

export default function MotionPreferencesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">Motion Preferences</h1>
        <p className="text-muted-foreground">
          Accessibility-aware animations that respect user motion preferences and enhance the experience.
        </p>
      </div>
      <MotionPreferencesDemo />
    </div>
  );
}