"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // We wait until the auth state is determined.
    if (!loading) {
      // If there is a user, we redirect to the dashboard.
      if (user) {
        router.replace('/dashboard');
      } else {
        // If there is no user, we redirect to the login page.
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // While loading, we show a spinner. This prevents flashes of content.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
