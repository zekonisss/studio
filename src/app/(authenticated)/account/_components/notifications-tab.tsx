"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";

export function NotificationsTab() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
        <p className="text-muted-foreground">{t('account.notifications.noNotifications')}</p>
    </div>
  );
}