
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserNav } from '@/components/navigation/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle'; // Added ThemeToggle import

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
    if (!loading && user) {
      const hasSeenWelcomeModal = localStorage.getItem('hasSeenWelcomeModal_drivercheck');
      if (!hasSeenWelcomeModal) {
        setShowWelcomeModal(true);
      }
    }
  }, [user, loading, router]);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcomeModal_drivercheck', 'true');
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; 
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
