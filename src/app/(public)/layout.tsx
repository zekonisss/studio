import { ReactNode } from "react";
import { UserSearch } from "lucide-react";
import Link from 'next/link';
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
        </div>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary cursor-pointer mb-6">
            <UserSearch className="h-10 w-10" />
            <span className="text-3xl font-bold">DriverCheck</span>
        </Link>
        {children}
    </div>
  );
}
