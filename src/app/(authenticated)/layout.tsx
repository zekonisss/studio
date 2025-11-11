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
    // Nukreipiame į prisijungimo puslapį TIK tada, kai baigėsi krovimas ir TIKRAI nėra vartotojo.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  // Rodyti viso ekrano krovimo indikatorių, kol tikrinamas autentifikacijos statusas.
  // Tai apsaugo nuo bet kokių bandymų atvaizduoti turinį ar nukreipti, kol nėra aiškios vartotojo būsenos.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Jei baigėsi krovimas, bet vartotojo vis dar nėra, nerodome nieko (nes useEffect jau nukreipia).
  // Tai apsaugo nuo trumpo išdėstymo pasirodymo prieš nukreipimą.
  if (!user) {
    return null;
  }
  
  // Kai krovimas baigtas ir turime vartotoją, atvaizduojame pilną išdėstymą.
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
