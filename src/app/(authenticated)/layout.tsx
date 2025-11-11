
"use client";

import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserNav } from '@/components/navigation/user-nav';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page ONLY when loading is finished and there is definitely no user.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  // Show a full-screen loading indicator while the authentication status is being checked.
  // This prevents any rendering attempts or redirects before the user state is clear.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is finished but there is still no user, we render nothing,
  // because the useEffect above is already handling the redirect.
  // This prevents a brief flash of the layout before the redirect happens.
  if (!user) {
    return null;
  }
  
  // When loading is complete and we have a user, render the full layout.
  return (
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
  );
}
