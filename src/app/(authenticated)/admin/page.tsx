"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementTab from "./_components/user-management-tab";
import EntryManagementTab from "./_components/entry-management-tab";
import AuditLogTab from "./_components/audit-log-tab";
import StatisticsTab from "./_components/statistics-tab";

export default function AdminPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{t('admin.pageTitle')}</CardTitle>
                            <CardDescription>{t('admin.users.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="users">{t('admin.tabs.userManagement')}</TabsTrigger>
                            <TabsTrigger value="entries">{t('admin.tabs.entryManagement')}</TabsTrigger>
                            <TabsTrigger value="audit-log">{t('admin.tabs.auditLog')}</TabsTrigger>
                            <TabsTrigger value="statistics">{t('admin.tabs.statistics')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="users">
                            <UserManagementTab />
                        </TabsContent>
                        <TabsContent value="entries">
                            <EntryManagementTab />
                        </TabsContent>
                        <TabsContent value="audit-log">
                            <AuditLogTab />
                        </TabsContent>
                        <TabsContent value="statistics">
                            <StatisticsTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
