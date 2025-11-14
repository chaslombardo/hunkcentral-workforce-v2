import { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrandButton } from '@/components/brand/brand-button';
import {
  BarChart3,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
              Reports
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access payroll information, analytics, and performance data
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.href}
              className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-hunks-green/10 group-hover:bg-hunks-green/20 transition-all duration-300">
                    <Icon className="h-6 w-6 text-hunks-green" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-hunks-green group-hover:text-hunks-green-700 transition-colors">
                      {category.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-6 text-base leading-relaxed">
                  {category.description}
                </CardDescription>
                <BrandButton variant="primary" asChild className="w-full">
                  <Link href={category.href}>View Reports</Link>
                </BrandButton>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card className="border-hunks-orange/20 bg-gradient-to-br from-hunks-orange/5 via-background to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl text-hunks-orange">
              <Calendar className="h-6 w-6" />
              <span>Quick Access</span>
            </CardTitle>
            <CardDescription className="text-base">
              Frequently accessed reports and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <BrandButton variant="outline-primary" asChild className="h-12">
                <Link
                  href="/reports/my-payroll"
                  className="flex items-center justify-center space-x-2"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Current Pay Period</span>
                </Link>
              </BrandButton>
              <BrandButton variant="outline-primary" asChild className="h-12">
                <Link
                  href="/reports/analytics"
                  className="flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>This Month&apos;s Analytics</span>
                </Link>
              </BrandButton>
              <BrandButton variant="outline-primary" asChild className="h-12">
                <Link
                  href="/reports/rankings"
                  className="flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Rankings</span>
                </Link>
              </BrandButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
