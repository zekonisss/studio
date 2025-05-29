
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Search, FilePlus2, History, UserCircle, BarChart3, AlertTriangle, CheckCircle2, UserCog, Loader2, Layers } from "lucide-react";
import Image from "next/image";
import { format as formatDateFn, addYears, addMonths, isBefore } from 'date-fns';
import { lt, enUS } from 'date-fns/locale'; // Added enUS for date formatting
import type { Report } from '@/types';
import { getReportsFromLocalStoragePublic, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports } from '@/types';
import { useLanguage } from '@/contexts/language-context'; // Added

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage(); // Added
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  const dateLocale = locale === 'en' ? enUS : lt;

  useEffect(() => {
    const fetchTotalReports = () => {
      const localReports = getReportsFromLocalStoragePublic();
      const combined = combineAndDeduplicateReports(localReports, MOCK_GENERAL_REPORTS);
      setTotalReportsCount(combined.length);
    };
    fetchTotalReports();
  }, []);


  const subscriptionEndDate = user?.accountActivatedAt ? addYears(new Date(user.accountActivatedAt), 1) : null;
  const showExpirationWarning = user?.paymentStatus === 'active' && subscriptionEndDate && isBefore(subscriptionEndDate, addMonths(new Date(), 1));

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-12 p-6 rounded-lg shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <h1 className="text-3xl font-bold">{t('dashboard.greeting', { contactPerson: user?.contactPerson || 'Vartotojau' })}</h1>
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
                <p className="text-2xl font-bold">N/A</p> {}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/history">{t('dashboard.overview.viewAll')}</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.overview.yourSearches')}</p>
                <p className="text-2xl font-bold">N/A</p> {}
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
            {showExpirationWarning && subscriptionEndDate && (
                <div className="p-4 border border-dashed border-yellow-500 bg-yellow-50 rounded-md text-yellow-700">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                    <div>
                    <h4 className="font-semibold">{t('dashboard.overview.subscriptionEndingSoon.title')}</h4>
                    <p className="text-sm">
                        {t('dashboard.overview.subscriptionEndingSoon.message', { endDate: formatDateFn(subscriptionEndDate, "yyyy-MM-dd", { locale: dateLocale }) })}
                    </p>
                    </div>
                </div>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{t('dashboard.usefulLinks.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                <Image src="https://placehold.co/600x338.png" alt="Driver Safety" layout="fill" objectFit="cover" data-ai-hint="driving safety" />
              </div>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/terms">{t('dashboard.usefulLinks.terms')}</Link>
            </Button>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/privacy">{t('dashboard.usefulLinks.privacy')}</Link>
            </Button>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/support">{t('dashboard.usefulLinks.support')}</Link>
            </Button>
            <div className="mt-4 pt-4 border-t">
                {user && user.paymentStatus === 'active' && subscriptionEndDate ? (
                    <>
                        <p className="text-sm font-semibold flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-600"/>
                        {t('dashboard.paymentStatus.active')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.paymentStatus.active.validUntil', { endDate: formatDateFn(subscriptionEndDate, "yyyy-MM-dd", { locale: dateLocale }) })}
                        </p>
                    </>
                ) : user && user.paymentStatus === 'pending_payment' ? (
                    <p className="text-sm font-semibold flex items-center text-yellow-700">
                        <Loader2 className="h-5 w-5 mr-2 text-yellow-600 animate-spin"/>
                        {t('dashboard.paymentStatus.pending_payment')}
                    </p>
                ) : user && user.paymentStatus === 'pending_verification' ? (
                    <p className="text-sm font-semibold flex items-center text-orange-600">
                        <UserCog className="h-5 w-5 mr-2 text-orange-600"/>
                        {t('dashboard.paymentStatus.pending_verification')}
                    </p>
                ) : (
                    <p className="text-sm font-semibold flex items-center text-red-700">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600"/>
                        {t('dashboard.paymentStatus.inactive')}
                    </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
