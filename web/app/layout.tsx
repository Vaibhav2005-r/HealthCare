import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { GlobalAlerts } from '@/components/GlobalAlerts';

export const metadata: Metadata = {
  title: 'SmartHealth Portal | Unified Healthcare Platform',
  description: 'Smart healthcare management dashboard for patients and doctors',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <div className="flex flex-col min-h-screen overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {children}
          </main>
        </div>
        <GlobalAlerts />
      </body>
    </html>
  );
}

