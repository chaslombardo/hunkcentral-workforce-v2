import { cn } from '@/lib/utils';

type LoaderSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<LoaderSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-10 w-10 border-4',
};

export interface BrandLoaderProps {
  label?: string;
  size?: LoaderSize;
  fullScreen?: boolean;
  subdued?: boolean;
}

export function BrandLoader({
  label = 'Loading data... ',
  size = 'md',
  fullScreen,
  subdued,
}: BrandLoaderProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center gap-3 text-sm text-muted-foreground',
        fullScreen && 'min-h-[240px]'
      )}
    >
      <span
        className={cn(
          'rounded-full border-r-transparent animate-spin',
          subdued ? 'border-muted-foreground/40' : 'border-hunks-green',
          subdued ? 'bg-transparent' : 'bg-transparent',
          SIZE_MAP[size]
        )}
        aria-hidden="true"
      />
      <span className="font-medium text-foreground/80">{label}</span>
    </div>
  );
}
