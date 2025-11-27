"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function PaymentsTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const getStatusContent = () => {
    switch (user?.paymentStatus) {
      case 'active':
        return {
          title: t('account.payments.status.active.title'),
          description: t('account.payments.status.active.description'),
          badge: <Badge>{t('admin.users.status.active')}</Badge>,
          details: (
            <>
              <p className="text-sm">{t('account.payments.status.active.validUntil')}: {'N/A'}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('account.payments.status.active.priceInfo', { monthlyPrice: 29.99, annualPrice: 359.99 })}</p>
            </>
          )
        };
      case 'pending_payment':
        return {
          title: t('account.payments.status.pending_payment.title'),
          description: t('account.payments.status.pending_payment.description'),
          badge: <Badge variant="destructive">{t('admin.users.status.pending_payment')}</Badge>
        };
      case 'pending_verification':
        return {
          title: t('account.payments.status.pending_verification.title'),
          description: t('account.payments.status.pending_verification.description'),
          badge: <Badge variant="secondary">{t('admin.users.status.pending_verification')}</Badge>
        };
      case 'inactive':
        return {
          title: t('account.payments.status.inactive.title'),
          description: t('account.payments.status.inactive.description'),
          badge: <Badge variant="destructive">{t('admin.users.status.inactive')}</Badge>
        };
      default:
        return { title: 'Unknown Status', description: '', badge: <Badge>Unknown</Badge> };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{statusContent.title}</span>
            {statusContent.badge}
          </CardTitle>
          <CardDescription>{statusContent.description}</CardDescription>
        </CardHeader>
        {statusContent.details && <CardContent>{statusContent.details}</CardContent>}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('account.payments.paymentHistoryTitle')}</CardTitle>
          <CardDescription>{t('account.payments.paymentHistoryDescription')}</CardDescription>
        </CardHeader>
      </Card>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-2">{t('account.payments.manageSubscriptionButton')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('account.payments.manageSubscriptionNote')}</p>
        <Button disabled>{t('account.payments.manageSubscriptionButton')}</Button>
         <p className="text-xs text-muted-foreground mt-6">
          {t('account.payments.footerNote')}
        </p>
      </div>

    </div>
  );
}