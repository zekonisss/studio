
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We only want to redirect once the loading is finished.
    if (!loading) {
      if (user) {
        // If there's a user, send them to their dashboard.
        const targetPath = user.isAdmin ? '/admin' : '/dashboard';
        router.replace(targetPath);
      } else {
        // If there's no user, send them to the login page.
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  // While the auth state is loading, show a spinner.
  // This covers the initial page load and authentication check.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
