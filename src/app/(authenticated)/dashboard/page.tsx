
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart, FileText, Search, AlertTriangle } from 'lucide-react';
import { WelcomeModal } from '@/components/shared/welcome-modal';
import * as storage from '@/lib/storage';
import type { Report, SearchLog } from '@/types';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const [totalReports, setTotalReports] = useState(0);
  const [userReportsCount, setUserReportsCount] = useState(0);
  const [userSearchesCount, setUserSearchesCount] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    // Rodyti pasveikinimo modalą tik pirmą kartą prisijungus
    const welcomeShown = sessionStorage.getItem('welcomeModalShown');
    if (!welcomeShown) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('welcomeModalShown', 'true');
    }

    async function fetchData() {
        if (user) {
            const [allReports, userReports, userSearches] = await Promise.all([
                storage.getAllReports(),
                storage.getUserReports(user.id),
                storage.getSearchLogs(user.id)
            ]);

            setTotalReports(allReports.length);
            setUserReportsCount(userReports.active.length);
            
            // Filtruojame paieškas pagal šį mėnesį
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlySearches = userSearches.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
            });
            setUserSearchesCount(monthlySearches.length);

            // Paimame 5 naujausius įrašus
            setRecentReports(allReports.slice(0, 5));
        }
    }
    fetchData();

  }, [user]);

  const greeting = useMemo(() => {
    return t('dashboard.greeting', { 
        contactPerson: user?.contactPerson || t('dashboard.defaultUser') 
    });
  }, [user, t]);

  const formattedEndDate = useMemo(() => {
    if (!user?.accountActivatedAt) return 'N/A';
    
    const activationDate = new Date(user.accountActivatedAt);
    const expiryDate = new Date(activationDate.setFullYear(activationDate.getFullYear() + 1));
    
    try {
        return new Intl.DateTimeFormat(t('common.localeForDate'), { year: 'numeric', month: 'long', day: 'numeric' }).format(expiryDate);
    } catch (e) {
        return expiryDate.toISOString().split('T')[0];
    }
  }, [user?.accountActivatedAt, t]);


  const isSubscriptionEndingSoon = useMemo(() => {
    if (!user?.accountActivatedAt) return false;
    const activationDate = new Date(user.accountActivatedAt);
    const expiryDate = new Date(activationDate.setFullYear(activationDate.getFullYear() + 1));
    const daysLeft = (expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 30; // Rodyti pranešimą, jei liko 30 dienų ar mažiau
  }, [user?.accountActivatedAt]);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  return (
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseModal} />
      <div className="flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{greeting}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {t('dashboard.platformDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-primary">{t('dashboard.company', { companyName: user?.companyName || '' })}</p>
             <div className="mt-2 text-sm text-muted-foreground">
              {t('dashboard.paymentStatus.active')}
              <span className="font-medium text-foreground ml-1">
                ({t('dashboard.paymentStatus.active.validUntil', {endDate: formattedEndDate})})
              </span>
            </div>
            {isSubscriptionEndingSoon && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">{t('dashboard.overview.subscriptionEndingSoon.title')}</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {t('dashboard.overview.subscriptionEndingSoon.message', {endDate: formattedEndDate})}
                      </p>
                    </div>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        <div>
            <h2 className="text-2xl font-bold mb-1">{t('dashboard.overview.title')}</h2>
            <p className="text-muted-foreground mb-4">{t('dashboard.overview.description')}</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.yourReports')}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userReportsCount}</div>
                  <Button variant="link" asChild className="px-0 h-auto text-xs">
                    <Link href="/reports/history">{t('dashboard.overview.viewHistory')}</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.yourSearches')}</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userSearchesCount}</div>
                   <Button variant="link" asChild className="px-0 h-auto text-xs">
                    <Link href="/search/history">{t('dashboard.overview.viewHistory')}</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalPlatformReports')}</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReports}</div>
                   <Button variant="link" asChild className="px-0 h-auto text-xs">
                    <Link href="/search">{t('dashboard.overview.viewAll')}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-1">{t('dashboard.recentReports.title')}</h2>
          <p className="text-muted-foreground mb-4">{t('dashboard.recentReports.description')}</p>
          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{report.fullName}</h3>
                            {report.birthYear && <span className="text-sm text-muted-foreground">({report.birthYear})</span>}
                        </div>
                        <p className={`text-sm font-medium ${DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'text-destructive' : 'text-primary'}`}>
                            {getCategoryNameForDisplay(report.category, t)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.recentReports.submittedBy')} <span className="font-medium">{report.reporterCompanyName}</span>
                        </p>
                   </div>
                   <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">{new Date(report.createdAt).toLocaleDateString(locale)}</p>
                        <Button variant="link" asChild className="px-0 h-auto text-xs mt-1">
                          <Link href={`/search?query=${encodeURIComponent(report.fullName)}`}>{t('dashboard.overview.viewAll')} <ArrowRight className="w-3 h-3 ml-1"/></Link>
                        </Button>
                   </div>
                </CardContent>
              </Card>
            )) : (
                <p className="text-muted-foreground text-center py-4">{t('dashboard.recentReports.noReports')}</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
