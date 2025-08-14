
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle'; 

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // This effect handles redirection and modal logic based on auth state.
    if (loading) {
      // If auth state is still loading, do nothing.
      // The loading screen will be rendered below.
      return;
    }
    
    if (!user) {
      // If not loading and no user, redirect to login.
      router.replace('/auth/login');
      return;
    }
    
    // Authorization logic for admin pages
    const isUserAdminPage = pathname.startsWith('/admin');
    const isUserImportPage = pathname.startsWith('/reports/import') || pathname.startsWith('/admin/user-import');

    if (!user.isAdmin && (isUserAdminPage || isUserImportPage)) {
       // If a non-admin user tries to access admin-only pages, redirect them.
       router.replace('/dashboard');
    }

    // Welcome modal logic
    // This runs only once per user session after they are confirmed to be logged in.
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

  // Render a full-page loading spinner while the auth state is being determined.
  // This is the key to preventing the "flicker" and ensuring we know the user's status.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not loading, and we have a user, we can render the main layout.
  // The redirection logic in the useEffect will have already handled cases where there's no user.
  return (
    user && (
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
    )
  );
}
