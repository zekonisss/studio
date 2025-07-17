
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/components/auth/login-form";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is not loading and a user object exists, redirect.
    if (!loading && user) {
      // Admins go to the admin panel, regular users go to the dashboard.
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      router.replace(targetPath);
    }
  }, [user, loading, router]);

  // While loading, we can show a loader to prevent flashes of content
  if (loading) {
     return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If we are not loading and there's no user, show the login form
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('login.title')}
      </h2>
      <LoginForm />
    </>
  );
}
