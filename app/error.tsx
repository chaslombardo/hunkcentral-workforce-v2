'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8 text-center">
      <div>
        <h2 className="text-2xl font-semibold">Something went wrong!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          An error occurred while loading this page.
        </p>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={
            // Attempt to recover by trying to re-render the segment
            reset
          }
        >
          Try again
        </button>
      </div>
    </div>
  );
}
