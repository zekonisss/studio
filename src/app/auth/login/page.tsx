
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
    // If the auth state is not loading and a user object exists, redirect.
    if (!loading && user) {
      // All users are redirected to the main dashboard.
      // The admin can then navigate to the admin panel from the sidebar.
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While loading, we can show a loader, or nothing, to prevent flashes of content
  if (loading) {
     return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, show the login form
  if (!user) {
    return (
      <>
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
          {t('login.title')}
        </h2>
        <LoginForm />
      </>
    );
  }

  // If user exists, we are in the process of redirecting, show loader.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
