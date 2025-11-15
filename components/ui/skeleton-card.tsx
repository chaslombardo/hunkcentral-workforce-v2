import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({
  className,
  children,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'relative h-32 w-full rounded-lg bg-muted p-6 animate-pulse',
        className
      )}
      {...props}
    >
      <div className="space-y-3">
        <div className="h-4 w-8 rounded bg-muted-foreground/20" />
        <div className="h-6 w-16 rounded bg-muted-foreground/20" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="h-3 w-12 rounded bg-muted-foreground/20" />
        </div>
      </div>
      {children}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative h-80 w-full rounded-lg bg-muted animate-pulse',
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    </div>
  );
}

export function SkeletonTable({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="h-10 w-full rounded bg-muted animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 w-full rounded bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}
