
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
    // If the user is already logged in, the main page.tsx will handle the redirect.
    // This effect is to prevent a flash of the login form while that redirect is happening.
    if (!loading && user) {
        // User is logged in, but might be on the login page momentarily.
        // The root page.tsx will redirect them. We can show a loader here.
        return;
    }
  }, [user, loading, router]);

  // The root layout handles the main loading state.
  // We only show the login form if we are NOT loading and there is NO user.
  if (loading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, the root page will redirect. In the meantime, we can show nothing or a loader.
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('login.title')}
      </h2>
      <LoginForm />
    </>
  );
}
