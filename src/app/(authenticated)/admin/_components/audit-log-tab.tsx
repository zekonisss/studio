
"use client";

import { useState, useEffect } from 'react';
import type { AuditLogEntry, LoginLog } from '@/types';
import { getAuditLogs, getLoginLogsWithUsers } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuditLogTab() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  
  const [adminLogs, setAdminLogs] = useState<AuditLogEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      const fetchAllLogs = async () => {
        setIsLoading(true);
        try {
          const [adminLogEntries, userLoginLogs] = await Promise.all([
            getAuditLogs(),
            getLoginLogsWithUsers(),
          ]);
          setAdminLogs(adminLogEntries);
          setLoginLogs(userLoginLogs);
        } catch (error) {
          console.error("Error fetching logs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllLogs();
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const getActionDetails = (log: AuditLogEntry): string => {
    const { actionKey, details } = log;
    
    switch(actionKey) {
        case 'user.status.changed':
            return t('auditLog.action.userStatusChanged', { 
                companyName: details.companyName, 
                userEmail: details.userEmail,
                oldStatus: t(`admin.users.status.${details.oldStatus}`),
                newStatus: t(`admin.users.status.${details.newStatus}`)
            });
        case 'report.deleted':
            return t('auditLog.action.reportDeleted', {
                driverFullName: details.driverFullName,
                reportId: details.reportId
            });
        case 'all.reports.deleted':
            return t('auditLog.action.allReportsDeleted', { count: details.count });
        case 'user.details.updated':
            return t('auditLog.action.userDetailsUpdated', {
                companyName: details.companyName,
                userEmail: details.userEmail,
                updatedFields: details.updatedFields.join(', ')
            });
        default:
            return `${actionKey}: ${JSON.stringify(details)}`;
    }
  };

  if (!user?.isAdmin) {
      return (
           <Card className="mt-6">
                <CardHeader>
                    <CardTitle>{t('admin.accessDenied')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{t('admin.adminOnly')}</p>
                </CardContent>
           </Card>
      )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('admin.auditLog.title')}</CardTitle>
        <CardDescription>{t('admin.auditLog.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin-actions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin-actions">{t('admin.tabs.adminActions')}</TabsTrigger>
            <TabsTrigger value="user-logins">{t('admin.tabs.userLogins')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin-actions" className="mt-4">
            <ScrollArea className="h-[400px]">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('admin.auditLog.table.timestamp')}</TableHead>
                        <TableHead>{t('admin.auditLog.table.admin')}</TableHead>
                        <TableHead>{t('admin.auditLog.table.details')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                        [...Array(10)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full max-w-lg" /></TableCell>
                            </TableRow>
                        ))
                    ) : adminLogs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                {t('admin.auditLog.noLogsFound')}
                            </TableCell>
                        </TableRow>
                   ) : (
                       adminLogs.map(log => (
                           <TableRow key={log.id}>
                               <TableCell>{new Date(log.timestamp).toLocaleString(locale)}</TableCell>
                               <TableCell>{log.adminName}</TableCell>
                               <TableCell>{getActionDetails(log)}</TableCell>
                           </TableRow>
                       ))
                   )}
                </TableBody>
            </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="user-logins" className="mt-4">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('admin.loginLog.table.user')}</TableHead>
                        <TableHead>{t('admin.loginLog.table.ipAddress')}</TableHead>
                        <TableHead>{t('admin.loginLog.table.device')}</TableHead>
                        <TableHead className="text-right">{t('admin.auditLog.table.timestamp')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full max-w-xs" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-36 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                  ) : loginLogs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            {t('admin.loginLog.noLogsFound')}
                        </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={log.userAgent}>{log.userAgent}</TableCell>
                        <TableCell className="text-right">{new Date(log.timestamp).toLocaleString(locale)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
