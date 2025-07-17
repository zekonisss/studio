
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/components/auth/login-form";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import * as storage from '@/lib/storage';

export default function LoginPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const checkUserProfile = async () => {
        const userProfile = await storage.getUserById(user.id);
        if (userProfile) {
          const targetPath = user.isAdmin ? '/admin' : '/dashboard';
          router.replace(targetPath);
        } else {
          // If user exists in Auth but not in Firestore, they need to create their profile.
          router.replace('/auth/create-profile');
        }
      };
      checkUserProfile();
    }
  }, [user, loading, router]);

  // While loading, we can show a loader to prevent flashes of content
  if (loading || (!loading && user)) { // Also show loader while redirecting
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
