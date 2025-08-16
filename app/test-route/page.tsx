export default function TestRoute() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Route Working!</h1>
      <p>If you can see this, the routing system is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}