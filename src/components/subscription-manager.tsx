
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSubscriptionStatus, createCustomerPortalSession } from '@/app/actions/stripe';
import { PricingTable } from './pricing-table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface SubscriptionStatus {
    isSubscribed: boolean;
    planName?: string | null;
    interval?: string;
    endDate?: number;
}

export function SubscriptionManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                const subStatus = await getSubscriptionStatus(user.id);
                setStatus(subStatus);
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Klaida',
                    description: 'Nepavyko gauti prenumeratos būsenos.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [user, toast]);

    const handleManageSubscription = async () => {
        if (!user) return;
        setIsPortalLoading(true);
        try {
            const { url, error } = await createCustomerPortalSession(user.id);
            if (error) throw new Error(error);
            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Klaida',
                description: `Nepavyko atidaryti valdymo portalo: ${error.message}`,
            });
            setIsPortalLoading(false);
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-40 mt-2" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        )
    }

    if (status?.isSubscribed) {
        return (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <CardTitle>{t('account.payments.status.active.title')}</CardTitle>
                            <CardDescription>{t('account.payments.status.active.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Jūsų planas: <Badge variant="secondary" className="text-base">{status.planName || 'Nenurodyta'}</Badge></p>
                        {status.endDate && (
                           <p className="text-sm text-muted-foreground">
                                {t('account.payments.status.active.validUntil')}:{' '}
                                <span className="font-semibold text-foreground">
                                    {new Date(status.endDate * 1000).toLocaleDateString(t('common.localeForDate') || 'lt-LT')}
                                </span>
                           </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                     <Button onClick={handleManageSubscription} disabled={isPortalLoading} className="w-full sm:w-auto">
                        {isPortalLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        {t('account.payments.manageSubscriptionButton')}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        {t('account.payments.manageSubscriptionNote')}
                    </p>
                </CardFooter>
            </Card>
        );
    }
    
    // Not subscribed or in trial without an active Stripe sub
    return <PricingTable />;
}
