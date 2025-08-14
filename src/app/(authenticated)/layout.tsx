
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle'; 

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (loading) {
      return; 
    }
    
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    
    const isUserAdminPage = pathname.startsWith('/admin');
    const isUserImportPage = pathname.startsWith('/reports/import') || pathname.startsWith('/admin/user-import');

    if (!user.isAdmin && (isUserAdminPage || isUserImportPage)) {
       router.replace('/dashboard');
    }
    
    if (user.paymentStatus === 'inactive' || user.paymentStatus === 'pending_verification' || user.paymentStatus === 'pending_payment') {
        const allowedPaths = ['/account', '/support'];
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        if (!isAllowed) {
            router.replace('/account?tab=payment');
        }
    }


    try {
      const hasSeenWelcomeModal = localStorage.getItem('hasSeenWelcomeModal_drivercheck');
      if (!hasSeenWelcomeModal) {
          setShowWelcomeModal(true);
      }
    } catch (e) {
      console.error("Could not access localStorage. Welcome modal will not be shown.", e);
    }
    
  }, [user, loading, router, pathname]);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    try {
      localStorage.setItem('hasSeenWelcomeModal_drivercheck', 'true');
    } catch (e) {
      console.error("Could not write to localStorage.", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block md:w-72">
          <SidebarNav isInSheet={false} />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
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
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
        {showWelcomeModal && <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />}
      </div>
  );
}
