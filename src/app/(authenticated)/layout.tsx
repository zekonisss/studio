
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Menu, LogOut, Timer } from 'lucide-react';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIdle } from '@/hooks/use-idle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UserSearch } from 'lucide-react';
import { PremiumLoadingScreen } from '@/components/ui/premium-loading';
import { TrialBanner } from '@/components/dashboard/trial-banner';


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const { isPromptVisible, reset } = useIdle({ 
    onIdle: logout,
    idleTime: 30, // in minutes
    promptTime: 2, // in minutes
  });

  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  const isAccountPage = pathname.startsWith('/account');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isLegalPage) {
      return;
    }
    
    if (isLoading) return;

    if (!user) {
      window.location.replace('/login');
      return;
    }

    const status = user.paymentStatus?.toLowerCase();
    const isAllowedInApp = status === 'active' || status === 'trial';

    // Admins have access to everything and should be redirected from pending page
    if (user.isAdmin) {
      if (pathname === '/activation-pending') {
        window.location.replace('/dashboard');
      }
      return;
    }

    // For regular users, check their status
    if (!isAllowedInApp && !isAccountPage) {
      // If user is not approved and not trying to access their account,
      // redirect them to the pending page.
      if (pathname !== '/activation-pending') {
        window.location.replace('/activation-pending');
      }
    } else if (isAllowedInApp) {
      // If user IS approved but somehow lands on the pending page,
      // redirect them to the dashboard.
      if (pathname === '/activation-pending') {
        window.location.replace('/dashboard');
      }
    }
  }, [user, isLoading, pathname, isLegalPage, isAccountPage]);


  // For unauthenticated users on legal pages, render a public-style layout
  if (isLegalPage && !isLoading && !user) {
    return (
      <div className={cn(
        "flex min-h-screen w-full flex-col items-center bg-muted/40 p-4 relative",
        "hero-aurora"
      )}>
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <ThemeToggle />
            <LanguageSwitcher />
        </div>
        <main className="relative z-10 w-full max-w-4xl mt-20">
          {children}
        </main>
      </div>
    )
  }
  
  if (isLoading || (!user && !isLegalPage)) {
    return <PremiumLoadingScreen />;
  }

  if (!user) {
    // This should not be reached if logic is correct, but it's a safeguard.
     return <PremiumLoadingScreen />;
  }

  const status = user.paymentStatus?.toLowerCase();
  const isAllowedInApp = status === 'active' || status === 'trial';
  
  // This is the loader screen that shows while redirecting to activation-pending.
  // It must also allow access to the account page to prevent a redirect loop.
  if (!user.isAdmin && !isAllowedInApp && pathname !== '/activation-pending' && !isAccountPage) {
    return <PremiumLoadingScreen />;
  }

  return (
    <>
      <AlertDialog open={isPromptVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex justify-center mb-4">
                <Timer className="h-16 w-16 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center">{t('session.timeout.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('session.timeout.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel onClick={logout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                {t('session.timeout.logoutButton')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={reset} className="w-full sm:w-auto">
                {t('session.timeout.stayButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden border-r bg-card md:block md:w-72">
          <SidebarNav isInSheet={false} />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
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
          <TrialBanner />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
