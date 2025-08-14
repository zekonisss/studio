
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
    // If the user is already logged in (e.g., they navigate to /login manually),
    // redirect them away from the login page.
    if (!loading && user) {
        const targetPath = user.isAdmin ? '/admin' : '/dashboard';
        router.replace(targetPath);
    }
  }, [user, loading, router]);

  // If auth state is still loading, or if the user exists and we are about to redirect,
  // show a loader to prevent a flash of the login form.
  if (loading || user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and no user, show the login form.
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('login.title')}
      </h2>
      <LoginForm />
    </>
  );
}
