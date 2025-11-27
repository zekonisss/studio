"use client";

import { UserSearch } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If the user is logged in, redirect them away from public pages.
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    // Don't render children if we are about to redirect
    if (user) {
        return null; 
    }
    
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
