"use client";

import { UserSearch } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
            <header className="absolute top-0 flex w-full items-center justify-between p-4 sm:p-8">
                 <div className="flex-1">
                    <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary cursor-pointer w-fit mx-auto sm:mx-0">
                        <UserSearch className="h-8 w-8" />
                        <span>DriverCheck</span>
                    </Link>
                 </div>
                 <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>
            </header>
            <main className="flex w-full items-center justify-center">
                 {children}
            </main>
        </div>
    );
}
