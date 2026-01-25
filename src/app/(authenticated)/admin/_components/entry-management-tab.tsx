"use client";

import { useState, useEffect } from 'react';
import type { Report } from '@/types';
import { getAllReports, reviewDeletionRequest, addAuditLogEntry, deleteAllReports, fixMissingStatus } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Loader2, Trash2, Wrench } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { DeleteEntryDialog } from './modals/delete-entry-dialog';
import { DeleteAllEntriesDialog } from './modals/delete-all-entries-dialog';
import { AdminEntryDetailsModal } from './modals/admin-entry-details-modal';

export default function EntryManagementTab() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for single entry deletion
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for all entries deletion
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // State for details modal
  const [reportToView, setReportToView] = useState<Report | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // State for status fixing
  const [isFixing, setIsFixing] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const reportList = await getAllReports(true);
      setReports(reportList.filter(r => r.status === 'active'));
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);
  
  const handleViewDetails = (report: Report) => {
    setReportToView(report);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete || !adminUser) return;

    setIsDeleting(true);
    try {
      await reviewDeletionRequest(reportToDelete.id, 'approved');
      
      await addAuditLogEntry({
        adminId: adminUser.id,
        adminName: adminUser.contactPerson,
        actionKey: 'report.deleted',
        details: {
          reportId: reportToDelete.id,
          driverFullName: reportToDelete.fullName
        }
      });
      
      toast({
        title: t('admin.entries.toast.entryDeleted.title'),
        description: t('admin.entries.toast.entryDeleted.description'),
      });
      
      setReports(prev => prev.filter(r => r.id !== reportToDelete.id));

    } catch (error) {
      console.error("Error deleting report:", error);
      toast({ variant: "destructive", title: "Klaida", description: "Nepavyko ištrinti įrašo." });
    } finally {
      setIsDeleting(false);
      setReportToDelete(null);
    }
  };

  const handleDeleteAllConfirm = async () => {
    if (!adminUser) return;
    setIsDeletingAll(true);
    try {
        const deletedCount = await deleteAllReports();
        
        await addAuditLogEntry({
            adminId: adminUser.id,
            adminName: adminUser.contactPerson,
            actionKey: 'all.reports.deleted',
            details: { count: deletedCount }
        });

        toast({
            title: t('admin.entries.toast.allEntriesDeleted.title'),
            description: t('admin.entries.toast.allEntriesDeleted.description', { count: deletedCount }),
        });
        
        await fetchReports();
    } catch (error) {
        console.error("Error deleting all reports:", error);
        toast({ variant: "destructive", title: "Klaida", description: "Nepavyko ištrinti visų įrašų." });
    } finally {
        setIsDeletingAll(false);
        setIsDeleteAllDialogOpen(false);
    }
  };

  const handleFixStatus = async () => {
    setIsFixing(true);
    try {
        await fixMissingStatus();
        toast({
            title: "Operacija sėkminga",
            description: "Įrašų būsenos sėkmingai pataisytos. Atnaujinkite puslapį, kad matytumėte pokyčius.",
        });
    } catch (error) {
        console.error("Error fixing statuses:", error);
        toast({ variant: "destructive", title: "Klaida", description: "Nepavyko pataisyti įrašų būsenų." });
    } finally {
        setIsFixing(false);
    }
  }

  return (
    <>
      <AdminEntryDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        report={reportToView}
      />
      <DeleteEntryDialog
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={handleDeleteConfirm}
        report={reportToDelete}
        isDeleting={isDeleting}
      />
      <DeleteAllEntriesDialog
        isOpen={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAllConfirm}
        isDeleting={isDeletingAll}
      />

      <Card className="mt-6">
        <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t('admin.entries.title')}</CardTitle>
              <CardDescription>Čia rodomi visi aktyvūs sistemos įrašai. Prašymai ištrinti ir ištrinti įrašai valdomi kituose skirtukuose.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button
                    variant="outline"
                    onClick={handleFixStatus}
                    disabled={isFixing}
                >
                    {isFixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                    Taisyti įrašų būsenas
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => setIsDeleteAllDialogOpen(true)}
                    disabled={isLoading || reports.length === 0}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('admin.entries.actions.deleteAllEntries')}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {t('admin.entries.noEntriesFound')}
                      </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.fullName}</TableCell>
                      <TableCell>
                        <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'}>
                          {getCategoryNameForDisplay(report.category, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.reporterCompanyName}</TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleDateString(locale)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(report)}>
                              {t('admin.entries.actions.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setReportToDelete(report)}
                            >
                              {t('admin.entries.actions.deleteEntry')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
