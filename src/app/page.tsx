
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // We only want to redirect once the loading is complete
    if (!loading) {
      if (user) {
        // If there's a user, go to the dashboard
        router.replace('/dashboard');
      } else {
        // If there's no user, go to the login page
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Show a loading spinner while the auth state is being determined.
  // This prevents any premature redirects.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
