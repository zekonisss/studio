"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, FileText, Search, Activity, Clock } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import Link from 'next/link';
import { getUserReports, getSearchLogs, getAllReports } from '@/lib/storage';
import { getRecentActivity } from '@/app/page-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsDistributionChart } from "@/components/dashboard/reports-distribution-chart";
import { AnimatedCounter } from '@/components/shared/animated-counter';
import { formatDistanceToNow } from 'date-fns';
import { lt } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  const [userReportsCount, setUserReportsCount] = useState(0);
  const [userSearchesCount, setUserSearchesCount] = useState(0);
  const [totalReportsCount, setTotalReportsCount] = useState(0);
  const [allReportsData, setAllReportsData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');

  useEffect(() => {
    setIsClient(true);
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
        const [userReportsData, userSearchLogs, allReports, activityLogs] = await Promise.all([
          getUserReports(user.id),
          getSearchLogs(user.id),
          getAllReports(),
          getRecentActivity()
        ]);
        
        const activeReports = allReports.filter(report => report.status === 'active');
        setAllReportsData(activeReports);
        setRecentLogs(activityLogs);

        setUserReportsCount(userReportsData.active.length);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const searchesThisMonth = userSearchLogs.filter(log => new Date(log.timestamp) >= startOfMonth);
        setUserSearchesCount(searchesThisMonth.length);
        
        setTotalReportsCount(activeReports.length);

        if (user.subscriptionEndDate) {
            const endDate = new Date(user.subscriptionEndDate);
            const today = new Date();
            const daysUntilExpiry = (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            setSubscriptionEndDate(endDate.toLocaleDateString(locale));
            if (daysUntilExpiry < 30) {
                setShowSubscriptionWarning(true);
            }
        }

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }

    if (user) {
        fetchStats();
    }
  }, [user, locale]);

  const StatCard = ({ title, value, icon: Icon, link, linkText, isLoading }: { title: string, value: number, icon: React.ElementType, link: string, linkText: string, isLoading: boolean }) => (
     <Card className="transition-shadow duration-300 hover:shadow-glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-16" />
            ) : (
                <div className="text-2xl font-bold"><AnimatedCounter value={value} /></div>
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
            {t('dashboard.greeting', { contactPerson: user?.companyName || user?.email || t('dashboard.defaultUser') })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.platformDescription')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title={t('dashboard.overview.yourReports')}
            value={userReportsCount}
            icon={FileText}
            link="/authenticated/reports/history"
            linkText={t('dashboard.overview.viewHistory')}
            isLoading={isStatsLoading}
          />
          <StatCard 
            title={t('dashboard.overview.yourSearches')}
            value={userSearchesCount}
            icon={Search}
            link="/authenticated/search/history"
            linkText={t('dashboard.overview.viewHistory')}
            isLoading={isStatsLoading}
          />
          <StatCard 
            title={t('dashboard.overview.totalPlatformReports')}
            value={totalReportsCount}
            icon={BarChart}
            link="/authenticated/search"
            linkText={t('dashboard.overview.viewAll')}
            isLoading={isStatsLoading}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 h-full">
            {isStatsLoading ? (
              <Skeleton className="h-[400px] w-full rounded-xl" />
            ) : (
              <ReportsDistributionChart reports={allReportsData} />
            )}
          </div>
          
          <Card className="lg:col-span-3 h-full transition-shadow duration-300 hover:shadow-glow-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5" />
                      Rinkos Aktyvumas
                  </CardTitle>
                  <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-muted-foreground">Live</span>
                  </div>
              </div>
              <CardDescription>Naujausios paieškos sistemoje</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLogs.length > 0 ? (
                  <div className="space-y-6">
                      {recentLogs.map((log) => (
                          <div key={log.id} className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                  <Search className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                  <p className="text-sm font-medium">{log.text}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Clock className="h-3 w-3" />
                                      {isClient ? formatDistanceToNow(new Date(log.time), { addSuffix: true, locale: lt }) : <Skeleton className="h-3 w-16" />}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Šiuo metu aktyvumo nėra.</p>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              Jūsų paieškos yra anoniminės. Šis skydelis rodo bendrą, anonimizuotą sistemos aktyvumą.
            </CardFooter>
          </Card>
        </div>
        
        {showSubscriptionWarning && user?.paymentStatus === 'active' && (
            <Card className="border-amber-500/50 bg-amber-500/10">
                <CardHeader>
                    <CardTitle className="text-amber-500">{t('dashboard.overview.subscriptionEndingSoon.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{t('dashboard.overview.subscriptionEndingSoon.message', { endDate: subscriptionEndDate })}</p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/authenticated/account?tab=payment">{t('account.payments.manageSubscriptionButton')}</Link>
                    </Button>
                </CardContent>
            </Card>
        )}

      </div>
    </>
  );
}
