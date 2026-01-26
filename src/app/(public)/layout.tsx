import { ReactNode } from "react";
import { UserSearch } from "lucide-react";
import Link from 'next/link';
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
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary cursor-pointer mb-6 z-10">
            <UserSearch className="h-10 w-10" />
            <span className="text-3xl font-bold">DriverCheck</span>
        </Link>
        <div className="relative z-10 flex w-full max-w-lg justify-center">
          {children}
        </div>
    </div>
  );
}
