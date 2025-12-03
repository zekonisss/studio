"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, FileText, Search } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
  }, []);


  return (
    <>
       <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
       <div className="space-y-6">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {t('dashboard.greeting', { contactPerson: user?.contactPerson || user?.email || t('dashboard.defaultUser') })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.platformDescription')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.overview.title')}</CardTitle>
            <CardDescription>{t('dashboard.overview.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.yourReports')}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <Link href="/reports/history" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    {t('dashboard.overview.viewHistory')} <ArrowRight className="h-3 w-3"/>
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.yourSearches')}</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">58</div>
                   <Link href="/search/history" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    {t('dashboard.overview.viewHistory')} <ArrowRight className="h-3 w-3"/>
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalPlatformReports')}</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,254</div>
                  <Link href="/search" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    {t('dashboard.overview.viewAll')} <ArrowRight className="h-3 w-3"/>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/50 bg-amber-50/20 dark:bg-amber-900/10">
            <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-500">{t('dashboard.overview.subscriptionEndingSoon.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{t('dashboard.overview.subscriptionEndingSoon.message', { endDate: '2024-12-31' })}</p>
                <Button asChild size="sm" className="mt-4">
                    <Link href="/account?tab=payment">{t('account.payments.manageSubscriptionButton')}</Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </>
  );
}
