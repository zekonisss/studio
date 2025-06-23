
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { BarChart3, AlertTriangle, CheckCircle2, UserCog, Loader2, Layers, FileText } from "lucide-react";
import { format as formatDateFn, addYears, addMonths, isBefore, differenceInDays } from 'date-fns';
import { lt, enUS } from 'date-fns/locale';
import type { Report } from '@/types';
import { 
  getReportsFromLocalStoragePublic, 
  MOCK_GENERAL_REPORTS, 
  combineAndDeduplicateReports,
  getSearchLogsFromLocalStoragePublic,
  MOCK_USER, 
  MOCK_USER_REPORTS, 
  MOCK_USER_SEARCH_LOGS,
  addUserNotification,
  getUserNotifications,
  getCategoryNameForDisplay
} from '@/types';
import { useLanguage } from '@/contexts/language-context';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [totalReportsCount, setTotalReportsCount] = useState(0);
  const [userReportsCount, setUserReportsCount] = useState(0);
  const [userSearchesCount, setUserSearchesCount] = useState(0);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const [expirationEndDate, setExpirationEndDate] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);


  const dateLocale = locale === 'en' ? enUS : lt;

  useEffect(() => {
    const fetchStats = () => {
      const localPlatformReports = getReportsFromLocalStoragePublic();
      const combinedPlatformReports = combineAndDeduplicateReports(localPlatformReports, MOCK_GENERAL_REPORTS);
      setTotalReportsCount(combinedPlatformReports.length);
      setRecentReports(combinedPlatformReports.slice(0, 4));

      if (user) {
        const allLocalReports = getReportsFromLocalStoragePublic(); 
        let userSpecificReports = allLocalReports.filter(r => r.reporterId === user.id);
        
        if (user.id === MOCK_USER.id) {
          const mockUserReportsNotInLocal = MOCK_USER_REPORTS.filter(
            mr => !userSpecificReports.some(lsr => lsr.id === mr.id)
          );
          userSpecificReports = [...userSpecificReports, ...mockUserReportsNotInLocal];
        }
        setUserReportsCount(userSpecificReports.length);

        const allLocalSearchLogs = getSearchLogsFromLocalStoragePublic();
        let userSpecificSearchLogs = allLocalSearchLogs.filter(log => log.userId === user.id);

        if (user.id === MOCK_USER.id) {
            const mockUserSearchLogsNotInLocal = MOCK_USER_SEARCH_LOGS.filter(
                msl => !userSpecificSearchLogs.some(lsl => lsl.id === msl.id)
            );
            userSpecificSearchLogs = [...userSpecificSearchLogs, ...mockUserSearchLogsNotInLocal];
        }
        setUserSearchesCount(userSpecificSearchLogs.length);
      } else {
        setUserReportsCount(0);
        setUserSearchesCount(0);
      }
    };
    fetchStats();
  }, [user]);


  useEffect(() => {
    if (user && user.paymentStatus === 'active' && user.accountActivatedAt) {
      const subEndDate = addYears(new Date(user.accountActivatedAt), 1);
      const shouldWarn = isBefore(subEndDate, addMonths(new Date(), 1));
      setShowExpirationWarning(shouldWarn);
      setExpirationEndDate(formatDateFn(subEndDate, "yyyy-MM-dd", { locale: dateLocale }));

      if (shouldWarn) {
        const existingNotifications = getUserNotifications(user.id);
        const hasExistingWarning = existingNotifications.some(
          n => n.type === 'subscription_warning' && 
               n.messageParams?.endDate === formatDateFn(subEndDate, "yyyy-MM-dd") && // Use consistent formatting for check
               !n.read
        );

        if (!hasExistingWarning) {
          addUserNotification(user.id, {
            type: 'subscription_warning',
            titleKey: 'notifications.subscriptionWarning.title',
            messageKey: 'notifications.subscriptionWarning.message',
            messageParams: { 
              endDate: formatDateFn(subEndDate, "yyyy-MM-dd", { locale: dateLocale }),
              daysLeft: differenceInDays(subEndDate, new Date())
            },
            link: '/account?tab=payment'
          });
        }
      }
    } else {
      setShowExpirationWarning(false);
      setExpirationEndDate(null);
    }
  }, [user, dateLocale, t]);


  const subscriptionEndDateForDisplay = user?.accountActivatedAt ? addYears(new Date(user.accountActivatedAt), 1) : null;

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-12 p-6 rounded-lg shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <h1 className="text-3xl font-bold">{t('dashboard.greeting', { contactPerson: user?.contactPerson || t('dashboard.defaultUser') })}</h1>
        <p className="text-lg mt-1">{t('dashboard.company', { companyName: user?.companyName || ''})}</p>
        <p className="mt-2 text-sm opacity-90">
          {t('dashboard.platformDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-2 h-6 w-6 text-primary" />
              {t('dashboard.overview.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.overview.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.overview.yourReports')}</p>
                <p className="text-2xl font-bold">{userReportsCount}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/history">{t('dashboard.overview.viewAll')}</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.overview.yourSearches')}</p>
                <p className="text-2xl font-bold">{userSearchesCount}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/search/history">{t('dashboard.overview.viewHistory')}</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div className="flex items-center">
                 <Layers className="mr-3 h-7 w-7 text-primary/80" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.overview.totalPlatformReports')}</p>
                  <p className="text-2xl font-bold">{totalReportsCount}</p>
                </div>
              </div>
            </div>
            {showExpirationWarning && expirationEndDate && (
                <div className="p-4 border border-dashed border-yellow-500 bg-yellow-50 rounded-md text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div>
                    <h4 className="font-semibold">{t('dashboard.overview.subscriptionEndingSoon.title')}</h4>
                    <p className="text-sm">
                        {t('dashboard.overview.subscriptionEndingSoon.message', { endDate: expirationEndDate })}
                    </p>
                    </div>
                </div>
                </div>
            )}
             <div className="mt-4 pt-4 border-t">
                {user && user.paymentStatus === 'active' && subscriptionEndDateForDisplay ? (
                    <>
                        <p className="text-sm font-semibold flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-600"/>
                        {t('dashboard.paymentStatus.active')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.paymentStatus.active.validUntil', { endDate: formatDateFn(subscriptionEndDateForDisplay, "yyyy-MM-dd", { locale: dateLocale }) })}
                        </p>
                    </>
                ) : user && user.paymentStatus === 'pending_payment' ? (
                    <p className="text-sm font-semibold flex items-center text-yellow-700 dark:text-yellow-400">
                        <Loader2 className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-500 animate-spin"/>
                        {t('dashboard.paymentStatus.pending_payment')}
                    </p>
                ) : user && user.paymentStatus === 'pending_verification' ? (
                    <p className="text-sm font-semibold flex items-center text-orange-600 dark:text-orange-400">
                        <UserCog className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-500"/>
                        {t('dashboard.paymentStatus.pending_verification')}
                    </p>
                ) : (
                    <p className="text-sm font-semibold flex items-center text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600 dark:text-red-500"/>
                        {t('dashboard.paymentStatus.inactive')}
                    </p>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
               <FileText className="mr-2 h-6 w-6 text-primary" />
               {t('dashboard.recentReports.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.recentReports.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports.length > 0 ? (
                <ul className="space-y-4">
                    {recentReports.map(report => (
                        <li key={report.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/30 transition-colors border">
                            <div>
                                <p className="font-semibold">{report.fullName}</p>
                                <p className="text-xs text-muted-foreground">{t('dashboard.recentReports.submittedBy')} {report.reporterCompanyName || t('common.notSpecified')}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <Badge variant="secondary" className="whitespace-nowrap">{getCategoryNameForDisplay(report.category, t)}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{formatDateFn(report.createdAt, "yyyy-MM-dd", { locale: dateLocale })}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>{t('dashboard.recentReports.noReports')}</p>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
                <Link href="/search">{t('dashboard.recentReports.viewAll')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
