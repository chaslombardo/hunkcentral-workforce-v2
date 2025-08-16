export default function CreateLogPageSimple() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Create Log - Simple Version</h1>
      <p>This is a simplified version to test if the route works.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}