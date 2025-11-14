export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
      </div>
    </div>
  );
}
