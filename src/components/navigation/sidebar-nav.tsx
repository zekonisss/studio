
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
  LogOut,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldQuestion,
  ShieldAlert // Added for Admin
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { href: "/dashboard", label: "Valdymo Skydas", icon: LayoutDashboard },
  { href: "/search", label: "Paieška", icon: Search },
  { href: "/reports/add", label: "Pridėti Pranešimą", icon: FilePlus2 },
];

const historyNavItems = [
 { href: "/reports/history", label: "Pranešimų Istorija", icon: History },
 { href: "/search/history", label: "Paieškų Istorija", icon: ListChecks },
];

const accountNavItems = [
  { href: "/account", label: "Mano Paskyra", icon: UserCircle },
  { href: "/account/settings", label: "Nustatymai", icon: Settings }, // Placeholder
  { href: "/support", label: "Pagalba & DUK", icon: ShieldQuestion }, // Placeholder
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
        <Link href="/dashboard" className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          <h1 className="text-2xl font-bold text-sidebar-primary">DriverShield</h1>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 p-4">
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Pagrindinis</h3>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
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
            ))}
          </div>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider hover:no-underline hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:text-sidebar-accent-foreground">
                Istorija ir Ataskaitos
              </AccordionTrigger>
              <AccordionContent className="pt-2 space-y-1">
                {historyNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost", size: "sm" }),
                      "w-full justify-start rounded-md text-sm font-medium pl-6",
                       pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-none">
               <AccordionTrigger className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider hover:no-underline hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:text-sidebar-accent-foreground">
                Paskyra ir Pagalba
              </AccordionTrigger>
              <AccordionContent className="pt-2 space-y-1">
                {accountNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost", size: "sm" }),
                      "w-full justify-start rounded-md text-sm font-medium pl-6",
                       pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
            {user?.isAdmin && (
              <AccordionItem value="item-admin" className="border-none">
                <AccordionTrigger className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider hover:no-underline hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:text-sidebar-accent-foreground">
                  Administratorius
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-1">
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        buttonVariants({ variant: pathname.startsWith(item.href) ? "secondary" : "ghost", size: "sm" }),
                        "w-full justify-start rounded-md text-sm font-medium pl-6",
                        pathname.startsWith(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
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
