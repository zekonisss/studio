"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AuditLogTab() {
  const { t } = useLanguage();

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
                        <TableHead>{t('admin.auditLog.table.action')}</TableHead>
                        <TableHead>{t('admin.auditLog.table.details')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            {t('admin.auditLog.noLogsFound')}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
