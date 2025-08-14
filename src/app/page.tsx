
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // While loading, do nothing. The loader will be displayed.
      return;
    }

    if (user) {
      // If loading is finished and we have a user, redirect them.
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      router.replace(targetPath);
    } else {
      // If loading is finished and there's no user, redirect to login.
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // Always display a loader while the logic in useEffect runs.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
