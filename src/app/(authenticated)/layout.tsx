
"use client";

import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, Menu } from 'lucide-react';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { UserNav } from '@/components/navigation/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <aside className="w-72 flex-col border-r bg-background md:flex">
          <SidebarNav />
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Atidaryti meniu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SidebarNav />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={logout} className="text-foreground hover:bg-accent/50">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">{t('sidebar.logout')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('sidebar.logout')}</p>
                </TooltipContent>
              </Tooltip>
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
