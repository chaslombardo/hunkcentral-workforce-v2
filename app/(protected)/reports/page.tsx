import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  TrendingUp,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports - HUNKCentral',
  description: 'Access payroll reports, analytics, and performance data',
};

export default function ReportsPage() {
  const reportCategories = [
    {
      title: 'My Payroll',
      description: 'View your personal payroll information and earnings',
      href: '/reports/my-payroll',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Analytics',
      description: 'Business analytics, performance metrics, and trends',
      href: '/reports/analytics',
      icon: BarChart3,
      color: 'text-blue-600',
    },
    {
      title: 'Performance Rankings',
      description: 'Captain performance rankings and team metrics',
      href: '/reports/rankings',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      title: 'Payroll Reports',
      description: 'Administrative payroll reports and summaries',
      href: '/reports/payroll',
      icon: FileText,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Access payroll information, analytics, and performance data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">
                  {category.description}
                </CardDescription>
                <Button asChild className="w-full">
                  <Link href={category.href}>
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Quick Access</span>
            </CardTitle>
            <CardDescription>
              Frequently accessed reports and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/reports/my-payroll" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Current Pay Period</span>
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports/analytics" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>This Month&apos;s Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports/rankings" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Performance Rankings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}