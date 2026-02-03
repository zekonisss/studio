"use client";

import { useAuth } from '@/hooks/use-auth';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TrialBanner() {
  const { user } = useAuth();

  // If user is not on trial, or if data is still loading, don't show the banner.
  if (!user || user.paymentStatus !== 'trial') {
    return null;
  }

  return (
    <div className="bg-amber-100 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-300">
      <div className="container mx-auto flex items-center justify-between p-3 text-sm gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>
            Bandomasis laikotarpis: Jūs naudojatės bandomąja versija. Likę kreditai:{' '}
            <strong className="font-bold text-foreground">{user.searchCredits ?? 0}</strong> paieškų,{' '}
            <strong className="font-bold text-foreground">{user.reportCredits ?? 0}</strong> įrašų.
          </p>
        </div>
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
          <Link href="/account?tab=payment">
            Tapti Partneriu
          </Link>
        </Button>
      </div>
    </div>
  );
}
