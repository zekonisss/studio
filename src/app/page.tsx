"use client";

import { Button } from "@/components/ui/button";
import { UserSearch, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.paymentStatus === 'active') {
                router.replace('/dashboard');
            } else {
                router.replace('/activation-pending');
            }
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-4">
            <UserSearch className="h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold">Sveiki atvykę į DriverCheck</h1>
            <p className="max-w-md text-muted-foreground">
                Platforma, skirta padėti įmonėms valdyti rizikas ir tikrinti vairuotojų informaciją.
            </p>
            <div className="mt-6 flex gap-4">
                <Button asChild>
                    <Link href="/login">Prisijungti</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/signup">Registruotis</Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
