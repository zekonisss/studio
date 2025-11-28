"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Report } from '@/types';
import { getAllReports, softDeleteReport, addAuditLogEntry, softDeleteAllReports } from '@/lib/server/actions';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { AdminEntryDetailsModal } from './modals/admin-entry-details-modal';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

export function EntryManagementTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedReports = await getAllReports();
      setReports(fetchedReports.filter(r => !r.deletedAt));
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleDelete = async (report: Report) => {
    if (!user) return;
    try {
      await softDeleteReport(report.id);
      await addAuditLogEntry({
        adminId: user.id,
        adminName: user.contactPerson,
        actionKey: 'reportDeleted',
        details: { reportId: report.id, driverFullName: report.fullName },
      });
      toast({
        title: t('admin.entries.toast.entryDeleted.title'),
        description: t('admin.entries.toast.entryDeleted.description'),
      });
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const handleDeleteAll = async () => {
     if (!user) return;
    try {
      const count = await softDeleteAllReports();
      await addAuditLogEntry({
        adminId: user.id,
        adminName: user.contactPerson,
        actionKey: 'allReportsDeleted',
        details: { count },
      });
       toast({
        title: t('admin.entries.toast.allEntriesDeleted.title'),
        description: t('admin.entries.toast.allEntriesDeleted.description', { count }),
      });
      fetchReports();
    } catch (error) {
        console.error("Error deleting all reports:", error);
    }
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat(t('common.localeForDate'), { dateStyle: 'medium' }).format(new Date(date));
  };
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (reports.length === 0) {
    return <p>{t('admin.entries.noEntriesFound')}</p>;
  }

  return (
    <div>
        <div className="mb-4 flex justify-end">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">{t('admin.entries.actions.deleteAllEntries')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('admin.entries.deleteAllDialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('admin.entries.deleteAllDialog.description')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll}>
                            {t('admin.entries.deleteAllDialog.confirmDeleteAll')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        <ScrollArea className="h-[60vh]">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>{t('admin.entries.table.personInEntry')}</TableHead>
                <TableHead>{t('admin.entries.table.category')}</TableHead>
                <TableHead>{t('admin.entries.table.submittedByCompany')}</TableHead>
                <TableHead>{t('admin.entries.table.submissionDate')}</TableHead>
                <TableHead className="text-right">{t('admin.entries.table.actions')}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {reports.map((report) => (
                <TableRow key={report.id}>
                <TableCell className="font-medium">{report.fullName}</TableCell>
                <TableCell><Badge variant="secondary">{getCategoryNameForDisplay(report.category, t)}</Badge></TableCell>
                <TableCell>{report.reporterCompanyName}</TableCell>
                <TableCell>{formatDate(report.createdAt as Date)}</TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(report)} className="mr-2">
                    {t('admin.entries.actions.viewDetails')}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">{t('admin.entries.actions.deleteEntry')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.entries.deleteDialog.title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('admin.entries.deleteDialog.description.part1')} <strong>{report.fullName}</strong>{t('admin.entries.deleteDialog.description.part2')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(report)}>
                                    {t('admin.entries.deleteDialog.confirmDelete')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </ScrollArea>
        {selectedReport && (
            <AdminEntryDetailsModal
            report={selectedReport}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            />
        )}
    </div>
  );
}
