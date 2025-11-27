"use client";

import { UserSearch } from "lucide-react";
import Link from "next/link";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
            <header className="absolute top-0 flex w-full items-center justify-center p-8">
                 <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary cursor-pointer">
                    <UserSearch className="h-8 w-8" />
                    <span>DriverCheck</span>
                </Link>
            </header>
            <main className="flex w-full items-center justify-center">
                 {children}
            </main>
        </div>
    );
}
