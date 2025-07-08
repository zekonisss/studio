
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/components/auth/login-form";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // After a successful login, all users are redirected to the main dashboard.
      // The admin can then navigate to the admin panel from the sidebar.
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('login.title')}
      </h2>
      <LoginForm />
    </>
  );
}
