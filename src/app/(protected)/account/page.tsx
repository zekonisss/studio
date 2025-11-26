"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyDetailsTab } from "./_components/company-details-tab";
import { MyEntriesTab } from "./_components/my-entries-tab";
import { SearchHistoryTab } from "./_components/search-history-tab";
import { PaymentsTab } from "./_components/payments-tab";
import { NotificationsTab } from "./_components/notifications-tab";
import { useSearchParams } from "next/navigation";

export default function AccountPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || "details";

  const tabs = [
    { value: "details", label: t('account.tabs.details') },
    { value: "entries", label: t('account.tabs.myEntries') },
    { value: "search-history", label: t('account.tabs.searchHistory') },
    { value: "payments", label: t('account.tabs.payments') },
    { value: "notifications", label: t('account.tabs.notifications') },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('account.pageTitle')}</h1>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.details.title')}</CardTitle>
              <CardDescription>{t('account.details.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyDetailsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.entries.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MyEntriesTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search-history">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.searchHistory.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchHistoryTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.payments.title')}</CardTitle>
              <CardDescription>{t('account.payments.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTab />
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t('account.notifications.title')}</CardTitle>
                <CardDescription>{t('account.notifications.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsTab />
              </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
