import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Arogya Prahari — Command Dashboard | आरोग्य प्रहरी',
  description: "One view, every district's risk. National Outbreak Detection and Healthcare Surveillance Command Center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F5F2] text-[#1D2321] font-sans antialiased">
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}


