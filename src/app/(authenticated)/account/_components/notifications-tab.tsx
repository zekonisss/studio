"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NotificationsTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.notifications.title')}</CardTitle>
        <CardDescription>{t('account.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
            <p>{t('account.notifications.noNotifications')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
