"use client";

import { UserSearch, Loader2 } from "lucide-react";
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
        if (loading) {
            return;
        }
        if (user) {
            if (user.paymentStatus === 'active') {
                router.replace('/dashboard');
            } else {
                router.replace('/activation-pending');
            }
        }
    }, [user, loading, router]);

    // Show loader only during the initial auth check.
    if (loading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If a user is found, we are redirecting, so don't render children to avoid flash.
    if (user) {
        return null;
    }
    
    // If no user and not loading, show the public page content.
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
