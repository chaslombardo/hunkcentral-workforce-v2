import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard - authentication will be handled by middleware
  redirect('/dashboard');
}