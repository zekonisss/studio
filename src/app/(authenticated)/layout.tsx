"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. DEBUG: Pamatysi tikrąsias reikšmes naršyklės konsolėje (F12)
    console.log('AUTH DEBUG:', {
      isAdmin: user?.isAdmin,
      paymentStatus: user?.paymentStatus,
      path: pathname
    });

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
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
