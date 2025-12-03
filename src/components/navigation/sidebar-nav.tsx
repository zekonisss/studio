"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetClose } from "@/components/ui/sheet";
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
  LogOut,
  ScrollText,
  ShieldCheck
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
];

const legalNavItemsBase = [
  { href: "/support", labelKey: "sidebar.support", icon: ShieldQuestion },
  { href: "/terms", labelKey: "sidebar.terms", icon: ScrollText },
  { href: "/privacy", labelKey: "sidebar.privacy", icon: ShieldCheck },
];

const adminNavItemsBase = [
  { href: "/admin", labelKey: "sidebar.adminPanel", icon: ShieldAlert },
  { href: "/reports/import", labelKey: "sidebar.importReports", icon: FileSpreadsheet },
  { href: "/admin/user-import", labelKey: "usersImport.title", icon: FileSpreadsheet}
];

interface SidebarNavProps {
  isInSheet?: boolean;
}

export function SidebarNav({ isInSheet = false }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage(); 

  const mainNavItems = mainNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const historyNavItems = historyNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const accountNavItems = accountNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const legalNavItems = legalNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));
  const adminNavItems = adminNavItemsBase.map(item => ({ ...item, label: t(item.labelKey) }));

  if (!user) return null;

  const NavLinkWrapper = ({ children }: { children: ReactNode }) => {
    if (isInSheet) {
      return <SheetClose asChild>{children}</SheetClose>;
    }
    return <>{children}</>;
  };

  const renderLinks = (items: { href: string; label: string; icon: React.ElementType }[]) => {
    return items.map((item) => (
      <NavLinkWrapper key={item.href}>
        <Link
          href={item.href}
          className={cn(
            buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost" , size: "default"}),
            "w-full justify-start rounded-md text-sm font-medium h-9", 
            pathname === item.href
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          {item.label}
        </Link>
      </NavLinkWrapper>
    ));
  };

  return (
    <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
        <NavLinkWrapper>
          <Link href="/dashboard" className="flex items-center space-x-3">
              <UserSearch className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-2xl font-bold text-sidebar-primary">{t('app.name')}</h1>
          </Link>
        </NavLinkWrapper>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          <div>
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.main')}</h3>
            {renderLinks(mainNavItems)}
          </div>

          <div>
            <h3 className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.history')}</h3>
            {renderLinks(historyNavItems)}
          </div>
          
          <div>
            <h3 className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.account')}</h3>
            {renderLinks(accountNavItems)}
          </div>

          {user?.isAdmin && (
            <div>
              <h3 className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.admin')}</h3>
              {renderLinks(adminNavItems)}
            </div>
          )}

          <div>
              <h3 className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t('sidebar.section.legal')}</h3>
              {renderLinks(legalNavItems)}
          </div>
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
              <LogOut className="mr-3 h-5 w-5" />
              {t('sidebar.logout')}
          </Button>
      </div>
    </div>
  );
}