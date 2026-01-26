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
import { ReputationTab } from './_components/reputation-tab'; // <--- NAUJAS IMPORTAS
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
                        <div className="p-3 bg-primary/10 rounded-full">
                            <UserCircle className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle>{t('account.pageTitle')}</CardTitle>
                            <CardDescription>{t('account.details.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={defaultTab} className="w-full">
                        {/* PAKEITIMAS: pritaikyta 6 skirtukams (lg:grid-cols-6) */}
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1">
                            <TabsTrigger value="details">{t('account.tabs.details')}</TabsTrigger>
                            <TabsTrigger value="my-entries">{t('account.tabs.myEntries')}</TabsTrigger>
                            <TabsTrigger value="search-history">{t('account.tabs.searchHistory')}</TabsTrigger>
                            <TabsTrigger value="payment">{t('account.tabs.payments')}</TabsTrigger>
                            <TabsTrigger value="notifications">{t('account.tabs.notifications')}</TabsTrigger>
                            {/* NAUJAS SKIRTUKAS */}
                            <TabsTrigger value="reputation" className="font-semibold text-blue-600 data-[state=active]:text-blue-700">
                                ⭐ {t('account.tabs.reputation') || "Reputacija"}
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
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
                            
                            {/* NAUJAS TURINYS */}
                            <TabsContent value="reputation">
                                <ReputationTab />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
