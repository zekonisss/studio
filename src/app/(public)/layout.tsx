import { ReactNode } from "react";
import { UserSearch } from "lucide-react";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { cn } from "@/lib/utils";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4 relative",
        "hero-aurora"
    )}>
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <ThemeToggle />
            <LanguageSwitcher />
        </div>
        <a href="/" className="flex items-center gap-2 group cursor-pointer mb-6 z-10">
            <UserSearch className="h-10 w-10 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent italic">
                DriverCheck
            </span>
        </a>
        <div className="relative z-10 flex w-full justify-center">
          {children}
        </div>
    </div>
  );
}
