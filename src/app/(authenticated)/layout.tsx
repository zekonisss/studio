"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Menu } from 'lucide-react';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 2. Jei vartotojo nėra - į login
    if (!user) {
      router.replace('/login');
      return;
    }

    const status = user.paymentStatus?.toLowerCase();

    // 🔥 3. ADMIN TAISYKLĖ: Jei ADMIN, praleidžiam visur
    if (user.isAdmin) {
      if (pathname === '/activation-pending') {
        router.replace('/dashboard'); // Arba /admin, priklauso nuo tavo struktūros
      }
      return;
    }

    // 🧠 4. PAPRASTŲ VARTOTOJŲ TAISYKLĖ
    const isActive = status === 'active' || status === 'paid' || status === 'trial';

    if (!isActive) {
      if (pathname !== '/activation-pending') {
        router.replace('/activation-pending');
      }
    } else {
      if (pathname === '/activation-pending') {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Kol nustatoma tapatybė, rodomas krovimosi ekranas
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Jei vartotojas neturi teisių matyti turinio (ne adminas ir neaktyvus), 
  // bet bando būti ne pending puslapyje - neleidžiame renderinti vaikų
  const status = user.paymentStatus?.toLowerCase();
  const isActive = status === 'active' || status === 'paid' || status === 'trial';
  
  if (!user.isAdmin && !isActive && pathname !== '/activation-pending') {
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="hidden border-r bg-card md:block md:w-72">
        <SidebarNav isInSheet={false} />
      </div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card px-4 shadow-sm sm:px-6">
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
  );
}
