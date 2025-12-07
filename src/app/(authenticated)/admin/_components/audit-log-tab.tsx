"use client";

import { useState, useEffect } from 'react';
import type { AuditLogEntry } from '@/types';
import { getAuditLogs, getUserById } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AuditLogTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      const fetchLogs = async () => {
        setIsLoading(true);
        try {
          const logEntries = await getAuditLogs();
          setLogs(logEntries);
        } catch (error) {
          console.error("Error fetching audit logs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLogs();
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
                    <CardTitle>Prieiga negalima</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Šis skydelis yra prieinamas tik administratoriams.</p>
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
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                {t('admin.auditLog.noLogsFound')}
                            </TableCell>
                        </TableRow>
                   ) : (
                       logs.map(log => (
                           <TableRow key={log.id}>
                               <TableCell>{new Date(log.timestamp).toLocaleString(t('common.localeForDate'))}</TableCell>
                               <TableCell>{log.adminName}</TableCell>
                               <TableCell>{getActionDetails(log)}</TableCell>
                           </TableRow>
                       ))
                   )}
                </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
