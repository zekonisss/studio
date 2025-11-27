"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "./_components/user-management-tab";
import { EntryManagementTab } from "./_components/entry-management-tab";
import { AuditLogTab } from "./_components/audit-log-tab";
import { StatisticsTab } from "./_components/statistics-tab";

export default function AdminPage() {
  const { t } = useLanguage();

  const tabs = [
    { value: "users", label: t('admin.tabs.userManagement') },
    { value: "entries", label: t('admin.tabs.entryManagement') },
    { value: "audit", label: t('admin.tabs.auditLog') },
    { value: "stats", label: t('admin.tabs.statistics') },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('admin.pageTitle')}</h1>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users.title')}</CardTitle>
              <CardDescription>{t('admin.users.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.entries.title')}</CardTitle>
              <CardDescription>{t('admin.entries.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <EntryManagementTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.auditLog.title')}</CardTitle>
              <CardDescription>{t('admin.auditLog.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.statistics.title')}</CardTitle>
              <CardDescription>{t('admin.statistics.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StatisticsTab />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
