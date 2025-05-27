
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetClose } from "@/components/ui/sheet"; // Added import
import {
  LayoutDashboard,
  Search,
  FilePlus2,
  History,
  ListChecks,
  UserCircle,
  LogOut,
  Settings,
  ShieldQuestion,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { href: "/dashboard", label: "Valdymo Skydas", icon: LayoutDashboard },
  { href: "/search", label: "Paieška", icon: Search },
  { href: "/reports/add", label: "Pridėti Įrašą", icon: FilePlus2 },
];

const historyNavItems = [
 { href: "/reports/history", label: "Įrašų Istorija", icon: History },
 { href: "/search/history", label: "Paieškų Istorija", icon: ListChecks },
];

const accountNavItems = [
  { href: "/account", label: "Mano Paskyra", icon: UserCircle },
  { href: "/account/settings", label: "Nustatymai", icon: Settings }, // Placeholder
  { href: "/support", label: "Pagalba & DUK", icon: ShieldQuestion },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Skydas", icon: ShieldAlert },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sėkmingai atsijungėte" });
    } catch (error) {
      toast({ variant: "destructive", title: "Atsijungimo klaida" });
    }
  };

  if (!user) return null;

  const initials = user.contactPerson
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="p-4 border-b border-sidebar-border">
        <SheetClose asChild>
          <Link href="/dashboard" className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            <h1 className="text-2xl font-bold text-sidebar-primary">DriverShield</h1>
          </Link>
        </SheetClose>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 p-4">
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Pagrindinis</h3>
            {mainNavItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost" , size: "default"}),
                    "w-full justify-start rounded-md text-sm font-medium",
                    pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <div>
            <h3 className="mb-2 mt-4 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Istorija ir Ataskaitos</h3>
            {historyNavItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost", size: "default" }),
                    "w-full justify-start rounded-md text-sm font-medium",
                    pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
          
          <div>
            <h3 className="mb-2 mt-4 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Paskyra ir Pagalba</h3>
            {accountNavItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: pathname.startsWith(item.href) && item.href !== '/support' ? "secondary" : "ghost", size: "default" }),
                    "w-full justify-start rounded-md text-sm font-medium",
                    pathname.startsWith(item.href) && item.href !== '/support' // Special handling for /account/settings etc.
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          {user?.isAdmin && (
            <div>
              <h3 className="mb-2 mt-4 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Administratorius</h3>
              {adminNavItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: pathname.startsWith(item.href) ? "secondary" : "ghost", size: "default" }),
                      "w-full justify-start rounded-md text-sm font-medium",
                      pathname.startsWith(item.href)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
             <AvatarImage src={`https://placehold.co/100x100.png?text=${initials}`} alt={user.contactPerson} data-ai-hint="avatar person" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">{user.companyName}</p>
            <p className="text-xs text-muted-foreground">{user.contactPerson}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          Atsijungti
        </Button>
      </div>
    </div>
  );
}

