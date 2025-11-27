"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export default function ActivationPendingPage() {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-xl rounded-xl border bg-card p-8 shadow-xl text-center">
        <h1 className="mb-4 text-3xl font-bold">
          {t('activationPending.title')}
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          {t('activationPending.description')}
        </p>

        <div className="flex flex-col items-center gap-4 mt-8 border-t pt-6">
          <p className="text-xs text-muted-foreground text-center">
            {t('activationPending.logoutPrompt')}
          </p>
          <Button variant="outline" onClick={logout}>
            {t('activationPending.logoutButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
