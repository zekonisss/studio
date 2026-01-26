import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DriverCheck',
  description: 'Patikima vairuotojų patikros platforma vežėjams. Sumažinkite rizikas ir priimkite saugesnius sprendimus.',
  keywords: ['vairuotojų patikra', 'vežėjai', 'rizikos valdymas', 'transportas', 'logistika', 'juodasis sąrašas'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
