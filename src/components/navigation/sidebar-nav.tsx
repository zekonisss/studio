"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Search,
  FilePlus2,
  History,
  ListChecks,
  UserCircle,
  ShieldQuestion,
  ShieldAlert,
  UserSearch, 
  FileSpreadsheet,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context"; 

const mainNavItemsBase = [
  { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/search", labelKey: "sidebar.search", icon: Search },
  { href: "/reports/add", labelKey: "sidebar.addReport", icon: FilePlus2 },
];

const historyNavItemsBase = [
 { href: "/reports/history", labelKey: "sidebar.reportsHistory", icon: History },
 { href: "/search/history", labelKey: "sidebar.searchHistory", icon: ListChecks },
];

const accountNavItemsBase = [
  { href: "/account", labelKey: "sidebar.account", icon: UserCircle },
  { href: "/support", labelKey: "sidebar.support", icon: ShieldQuestion },
];

const adminNavItemsBase = [
  { href: "/admin", labelKey: "sidebar.adminPanel", icon: ShieldAlert },
  { href: "/reports/import", labelKey: "sidebar.importReports", icon: FileSpreadsheet },
  { href: "/admin/user-import", labelKey: "usersImport.title", icon: FileSpreadsheet}
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage(); 

  const mainNavItems = mainNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const historyNavItems = historyNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const accountNavItems = accountNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const adminNavItems = adminNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <UserSearch className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">{t('app.name')}</h1>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          <div>
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.main')}</h3>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost" , size: "default"}),
                  "w-full justify-start rounded-md text-base font-medium h-10"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.history')}</h3>
            {historyNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost", size: "default" }),
                  "w-full justify-start rounded-md text-base font-medium h-10"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="mt-4">
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.account')}</h3>
            {accountNavItems.map((item) => (
               <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: pathname.startsWith(item.href) && (item.href !== '/support' || pathname === '/support') ? "secondary" : "ghost", size: "default" }),
                  "w-full justify-start rounded-md text-base font-medium h-10"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>

          {user?.isAdmin && (
            <div className="mt-4">
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.admin')}</h3>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: pathname.startsWith(item.href) ? "secondary" : "ghost", size: "default" }),
                    "w-full justify-start rounded-md text-base font-medium h-10"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto border-t">
          <Button variant="ghost" className="w-full justify-start text-base h-10" onClick={logout}>
              <LogOut className="mr-3 h-5 w-5" />
              {t('sidebar.logout')}
          </Button>
      </div>
    </div>
  );
}
