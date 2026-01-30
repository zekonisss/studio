"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'card' | 'bank_transfer';

export default function PaymentsTab() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethod | null>(null);
  
  const handleManageSubscription = async () => {
    if (!user) return;

    setIsPortalLoading(true);
    try {
        const response = await fetch('/api/stripe/create-portal-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Nepavyko sukurti kliento portalo sesijos.');
        }

        const { url } = await response.json();
        window.location.href = url;
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Klaida",
            description: error.message,
        });
        setIsPortalLoading(false);
    }
  };

  const handleSubscribe = async (method: PaymentMethod) => {
    if (!user) return;
    setLoadingMethod(method);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, paymentMethod: method }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nepavyko sukurti mokėjimo sesijos.');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Mokėjimo Klaida",
        description: error.message,
      });
    } finally {
        setLoadingMethod(null);
    }
  };

  const getStatusComponent = () => {
    if (!user) return null;

    switch (user.paymentStatus) {
      case 'active':
        return (
          <>
            <CardTitle className="text-primary">{t('account.payments.status.active.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.active.description')}</CardDescription>
            {user.subscriptionEndDate ? (
              <p className="text-sm pt-2">{t('account.payments.status.active.validUntil')}: <span className="font-semibold">{new Date(user.subscriptionEndDate).toLocaleDateString(locale)}</span></p>
            ) : null}
             <p className="text-xs text-muted-foreground pt-1">{t('account.payments.status.active.priceInfo', { annualPrice: '359.99' })}</p>
          </>
        );
      case 'trial':
        return (
          <>
            <CardTitle className="text-blue-500">{t('account.payments.status.trial.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.trial.description', { searchCredits: user.searchCredits, reportCredits: user.reportCredits })}</CardDescription>
          </>
        );
      case 'pending_payment':
        return (
          <>
            <CardTitle className="text-amber-500">{t('account.payments.status.pending_payment.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.pending_payment.description')}</CardDescription>
          </>
        );
       case 'pending_verification':
        return (
            <>
                <CardTitle className="text-blue-500">{t('account.payments.status.pending_verification.title')}</CardTitle>
                <CardDescription>{t('account.payments.status.pending_verification.description')}</CardDescription>
            </>
        );
      case 'inactive':
        return (
          <>
            <CardTitle className="text-destructive">{t('account.payments.status.inactive.title')}</CardTitle>
            <CardDescription>{t('account.payments.status.inactive.description')}</CardDescription>
          </>
        );
      default:
        return null;
    }
  };

  const getActionButtons = () => {
    if (!user) return null;
    if (user.paymentStatus === 'active') {
        return (
            <>
                <Button onClick={handleManageSubscription} disabled={isPortalLoading}>
                    {isPortalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('account.payments.manageSubscriptionButton')}
                </Button>
                <p className="text-xs text-muted-foreground">{t('account.payments.manageSubscriptionNote')}</p>
            </>
        )
    }

    if (['inactive', 'pending_payment', 'pending_verification', 'trial'].includes(user.paymentStatus)) {
        return (
            <div className="space-y-4">
                <p className="text-sm font-medium">Aktyvuokite metinę prenumeratą:</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => handleSubscribe('card')} disabled={!!loadingMethod}>
                        {loadingMethod === 'card' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <CreditCard className="mr-2 h-4 w-4" />
                        Mokėti kortele (prenumerata)
                    </Button>
                    <Button onClick={() => handleSubscribe('bank_transfer')} disabled={!!loadingMethod} variant="secondary">
                        {loadingMethod === 'bank_transfer' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Banknote className="mr-2 h-4 w-4" />
                        Gauti sąskaitą pavedimui
                    </Button>
                </div>
            </div>
        )
    }

    return null;
  }

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
               {getActionButtons()}
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
