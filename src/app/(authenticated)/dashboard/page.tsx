"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, FileText, Search, Loader2 } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import Link from 'next/link';
import { getUserReports, getSearchLogs, getAllReports } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  const [userReportsCount, setUserReportsCount] = useState(0);
  const [userSearchesCount, setUserSearchesCount] = useState(0);
  const [totalReportsCount, setTotalReportsCount] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      setIsStatsLoading(true);
      try {
        const [userReportsData, userSearchLogs, allReports] = await Promise.all([
          getUserReports(user.id),
          getSearchLogs(user.id),
          getAllReports()
        ]);
        
        // User reports count
        setUserReportsCount(userReportsData.active.length);

        // User searches this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const searchesThisMonth = userSearchLogs.filter(log => new Date(log.timestamp) >= startOfMonth);
        setUserSearchesCount(searchesThisMonth.length);
        
        // Total platform reports
        setTotalReportsCount(allReports.filter(report => !report.deletedAt).length);

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, link, linkText, isLoading }: { title: string, value: number, icon: React.ElementType, link: string, linkText: string, isLoading: boolean }) => (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-16" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
            <Link href={link} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {linkText} <ArrowRight className="h-3 w-3"/>
            </Link>
        </CardContent>
    </Card>
  );


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
              <StatCard 
                title={t('dashboard.overview.yourReports')}
                value={userReportsCount}
                icon={FileText}
                link="/reports/history"
                linkText={t('dashboard.overview.viewHistory')}
                isLoading={isStatsLoading}
              />
               <StatCard 
                title={t('dashboard.overview.yourSearches')}
                value={userSearchesCount}
                icon={Search}
                link="/search/history"
                linkText={t('dashboard.overview.viewHistory')}
                isLoading={isStatsLoading}
              />
               <StatCard 
                title={t('dashboard.overview.totalPlatformReports')}
                value={totalReportsCount}
                icon={BarChart}
                link="/search"
                linkText={t('dashboard.overview.viewAll')}
                isLoading={isStatsLoading}
              />
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
