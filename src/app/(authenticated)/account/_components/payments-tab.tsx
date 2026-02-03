
"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SubscriptionManager } from '@/components/subscription-manager';

export default function PaymentsTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.payments.title')}</CardTitle>
        <CardDescription>{t('account.payments.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SubscriptionManager />
      </CardContent>
    </Card>
  );
}
