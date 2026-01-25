"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PaymentsTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const getStatusComponent = () => {
    if (!user) return null;

    switch (user.paymentStatus) {
      case 'active':
        return (
          <>
            <CardTitle className="text-green-600">{t('account.payments.status.active.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.active.description')}</CardDescription>
            <p className="text-sm pt-2">{t('account.payments.status.active.validUntil')}: <span className="font-semibold">2025-07-26</span></p>
             <p className="text-xs text-muted-foreground pt-1">{t('account.payments.status.active.priceInfo', { monthlyPrice: '29.99', annualPrice: '359.99' })}</p>
          </>
        );
      case 'pending_payment':
        return (
          <>
            <CardTitle className="text-amber-600">{t('account.payments.status.pending_payment.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.pending_payment.description')}</CardDescription>
          </>
        );
       case 'pending_verification':
        return (
            <>
                <CardTitle className="text-blue-600">{t('account.payments.status.pending_verification.title')}</CardTitle>
                <CardDescription>{t('account.payments.status.pending_verification.description')}</CardDescription>
            </>
        );
      case 'inactive':
        return (
          <>
            <CardTitle className="text-red-600">{t('account.payments.status.inactive.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.inactive.description')}</CardDescription>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.payments.title')}</CardTitle>
        <CardDescription>{t('account.payments.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Card>
          <CardHeader>
            {getStatusComponent()}
          </CardHeader>
           <CardFooter className="flex flex-col items-start gap-4">
               <Button asChild>
                    <Link href="#" target="_blank">{t('account.payments.manageSubscriptionButton')}</Link>
               </Button>
               <p className="text-xs text-muted-foreground">{t('account.payments.manageSubscriptionNote')}</p>
           </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>{t('account.payments.paymentHistoryTitle')}</CardTitle>
                <CardDescription>{t('account.payments.paymentHistoryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-4">
                    <p>Mokėjimų istorija bus rodoma čia.</p>
                </div>
            </CardContent>
        </Card>
      </CardContent>
       <CardFooter className="border-t pt-6">
           <p className="text-sm text-muted-foreground">{t('account.payments.footerNote')}</p>
      </CardFooter>
    </Card>
  );
}
