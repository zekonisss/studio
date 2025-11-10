"use client";

import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { UserNav } from '@/components/navigation/user-nav';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-72 flex-col border-r bg-card md:flex">
        <SidebarNav isInSheet={false} />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Atidaryti meniu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigacijos Meniu</SheetTitle>
                <SidebarNav isInSheet={true} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
