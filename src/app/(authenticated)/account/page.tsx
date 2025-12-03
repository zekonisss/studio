"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle } from "lucide-react";
import CompanyDetailsTab from './_components/company-details-tab';
import MyEntriesTab from './_components/my-entries-tab';
import SearchHistoryTab from './_components/search-history-tab';
import PaymentsTab from './_components/payments-tab';
import NotificationsTab from './_components/notifications-tab';
import { useLanguage } from '@/contexts/language-context';

export default function AccountPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'details';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <UserCircle className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{t('account.pageTitle')}</CardTitle>
                            <CardDescription>{t('account.details.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                            <TabsTrigger value="details">{t('account.tabs.details')}</TabsTrigger>
                            <TabsTrigger value="my-entries">{t('account.tabs.myEntries')}</TabsTrigger>
                            <TabsTrigger value="search-history">{t('account.tabs.searchHistory')}</TabsTrigger>
                            <TabsTrigger value="payment">{t('account.tabs.payments')}</TabsTrigger>
                            <TabsTrigger value="notifications">{t('account.tabs.notifications')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <CompanyDetailsTab />
                        </TabsContent>
                        <TabsContent value="my-entries">
                            <MyEntriesTab />
                        </TabsContent>
                        <TabsContent value="search-history">
                            <SearchHistoryTab />
                        </TabsContent>
                        <TabsContent value="payment">
                            <PaymentsTab />
                        </TabsContent>
                        <TabsContent value="notifications">
                           <NotificationsTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
