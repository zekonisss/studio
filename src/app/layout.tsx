import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/use-auth';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { UserNav } from '@/components/navigation/user-nav';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const roboto_mono = Roboto_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DriverCheck',
  description: 'Driver Information & Risk Check Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body className={`${inter.variable} ${roboto_mono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
                <div className="flex min-h-screen w-full bg-muted/40">
                <div className="hidden border-r bg-card md:block md:w-72">
                    <SidebarNav isInSheet={false} />
                </div>
                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
                    <div className="md:hidden">
                        <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Atidaryti meniu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <SheetTitle className="sr-only">Navigacijos Meniu</SheetTitle>
                            <SidebarNav isInSheet={true} />
                        </SheetContent>
                        </Sheet>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <UserNav />
                    </div>
                    </header>
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
                </div>
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
