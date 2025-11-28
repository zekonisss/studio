"use client";

import { useState, useEffect } from 'react';
import type { AuditLogEntry } from '@/types';
import { getAuditLogs } from '@/lib/server/db';
import { useLanguage } from '@/contexts/language-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AuditLogTab() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const fetchedLogs = await getAuditLogs();
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat(t('common.localeForDate'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };
  
  const getActionTranslation = (log: AuditLogEntry) => {
    const key = `auditLog.action.${log.actionKey}`;
    return t(key, log.details);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (logs.length === 0) {
    return <p>{t('admin.auditLog.noLogsFound')}</p>;
  }

  return (
    <ScrollArea className="h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">{t('admin.auditLog.table.timestamp')}</TableHead>
            <TableHead className="w-[150px]">{t('admin.auditLog.table.admin')}</TableHead>
            <TableHead>{t('admin.auditLog.table.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs">{formatDate(log.timestamp as Date)}</TableCell>
              <TableCell>{log.adminName}</TableCell>
              <TableCell>{getActionTranslation(log)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
