import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-optimizations.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { ProductionErrorMonitor } from '@/components/production-error-monitor';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#026937',
};

export const metadata: Metadata = {
  title: 'HUNKCentral - Workforce Management',
  description:
    'Digital workforce management system for College Hunks Hauling Junk & Moving',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HUNKCentral',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'HUNKCentral',
    'application-name': 'HUNKCentral',
    'msapplication-TileColor': '#026937',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
        <ServiceWorkerRegistration />
        <PerformanceMonitor pageName="root-layout" />
        <ProductionErrorMonitor />
      </body>
    </html>
  );
}
