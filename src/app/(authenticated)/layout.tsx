"use client";

import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Loader2, LogOut, Timer } from 'lucide-react';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserNav } from '@/components/navigation/user-nav';
import Link from 'next/link';
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

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const { isIdle, isPromptVisible, start, reset } = useIdle({ 
    onIdle: logout,
    idleTime: 30, // 30 minutes
  });

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (user.paymentStatus !== 'active') {
      router.replace('/activation-pending');
      return;
    }

  }, [user, loading, router]);
  
  if (loading || !user || user.paymentStatus !== 'active') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
    </>
  );
}
