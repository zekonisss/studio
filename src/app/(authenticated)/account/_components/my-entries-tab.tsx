"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';
import type { Report } from '@/types';
import { getUserReports, requestReportDeletion } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2, Loader2, Inbox, MoreHorizontal, Eye, Send, Hourglass } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReportDetailsModal } from '@/app/(authenticated)/reports/history/_components/report-details-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from '@/lib/constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyEntriesTab() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeReports, setActiveReports] = useState<Report[]>([]);
  const [deletedReports, setDeletedReports] = useState<Report[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [reportForDeletion, setReportForDeletion] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");

  const fetchReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const { active, deleted, pending } = await getUserReports(user.id);
        setActiveReports(active);
        setDeletedReports(deleted);
        setPendingReports(pending);
    } catch (error) {
        console.error("Error fetching user reports:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchReports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleViewDetails = (report: Report) => {
      setSelectedReport(report);
      setIsModalOpen(true);
  };

  const handleRequestDeletion = async () => {
    if (!reportForDeletion || !deletionReason.trim()) {
        toast({ variant: 'destructive', title: 'Klaida', description: 'Būtina nurodyti ištrynimo priežastį.' });
        return;
    }

    setIsSubmitting(true);
    try {
        await requestReportDeletion(reportForDeletion.id, deletionReason);
        toast({
            title: 'Prašymas išsiųstas',
            description: 'Jūsų prašymas ištrinti įrašą buvo sėkmingai pateiktas administratoriui.',
        });
        await fetchReports(); // Re-fetch all reports to update lists
    } catch (error) {
        console.error("Error requesting report deletion:", error);
        toast({ variant: 'destructive', title: 'Klaida', description: 'Nepavyko išsiųsti prašymo.' });
    } finally {
        setIsSubmitting(false);
        setReportForDeletion(null);
        setDeletionReason("");
    }
  };
  
  const NoEntriesView = ({ tab }: { tab: 'active' | 'deleted' | 'pending' }) => {
    const messages = {
        active: {
            title: t('reports.history.noEntries.title'),
            message: t('reports.history.noEntries.message'),
            buttonText: t('reports.history.noEntries.createFirstButton'),
            showButton: true
        },
        pending: {
            title: 'Nėra laukiančių prašymų',
            message: 'Kai pateiksite prašymą ištrinti įrašą, jis atsiras čia.',
            buttonText: '',
            showButton: false
        },
        deleted: {
            title: t('account.entries.noDeletedEntries'),
            message: t('account.entries.deletedDescription'),
            buttonText: '',
            showButton: false
        }
    };
    const current = messages[tab];
    return (
        <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg mt-6">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{current.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{current.message}</p>
            {current.showButton && (
                <Button asChild className="mt-6">
                    <Link href="/reports/add">
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        {current.buttonText}
                    </Link>
                </Button>
            )}
        </div>
    );
  };
  
  const getStatusBadge = (status: Report['status']) => {
    switch(status) {
        case 'pending_delete':
            return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900"><Hourglass className="mr-1 h-3 w-3" />Laukia patvirtinimo</Badge>;
        default:
            return null; // Active and Deleted tabs don't need a status badge here
    }
  }

  const ReportsTable = ({ reports, tab }: { reports: Report[], tab: 'active' | 'pending' | 'deleted' }) => (
    <div className="mt-4 border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.entries.table.personInEntry')}</TableHead>
            <TableHead>{t('admin.entries.table.category')}</TableHead>
            {tab === 'pending' && <TableHead>Būsena</TableHead>}
            <TableHead>{tab === 'deleted' ? t('account.entries.deletedOn') : t('admin.entries.table.submissionDate')}</TableHead>
            <TableHead className="text-right">{t('admin.entries.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.fullName}</TableCell>
              <TableCell>
                <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'}>
                  {getCategoryNameForDisplay(report.category, t)}
                </Badge>
              </TableCell>
               {tab === 'pending' && <TableCell>{getStatusBadge(report.status)}</TableCell>}
              <TableCell>{new Date(tab === 'deleted' && report.statusUpdatedAt ? report.statusUpdatedAt : report.createdAt).toLocaleDateString(locale)}</TableCell>
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
                      <Eye className="mr-2 h-4 w-4" />
                      <span>{t('reports.history.entry.viewDetailsButton')}</span>
                    </DropdownMenuItem>
                    {tab === 'active' && (
                      <DropdownMenuItem onClick={() => setReportForDeletion(report)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Send className="mr-2 h-4 w-4" />
                        <span>Pateikti trynimui</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
        <ReportDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            report={selectedReport}
        />

        <AlertDialog open={!!reportForDeletion} onOpenChange={(isOpen) => !isOpen && setReportForDeletion(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Pateikti įrašo trynimo prašymą?</AlertDialogTitle>
                <AlertDialogDescription>
                    Prašome nurodyti priežastį, kodėl norite ištrinti šį įrašą. Administratorius peržiūrės jūsų prašymą.
                </AlertDialogDescription>
                 <Textarea 
                    placeholder="Trynimo priežastis..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="mt-4"
                />
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Atšaukti</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestDeletion} disabled={isSubmitting || !deletionReason.trim()}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pateikti prašymą
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="mt-6 border-0 shadow-none">
          <CardHeader>
            <CardTitle>{t('account.entries.title')}</CardTitle>
            <CardDescription>
              {t('account.entries.description.part1')}
              <Link href="/reports/history" className="underline text-primary hover:text-primary/80">
                {t('account.entries.description.link')}
              </Link>
              {t('account.entries.description.part2')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                  <div className="space-y-4 mt-6">
                      <Skeleton className="h-10 w-full" /> 
                      <div className="border rounded-lg p-4 space-y-4">
                          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                  </div>
            ) : (
                  <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active">Aktyvūs ({activeReports.length})</TabsTrigger>
                        <TabsTrigger value="pending">Laukiantys ({pendingReports.length})</TabsTrigger>
                        <TabsTrigger value="deleted">Ištrinti ({deletedReports.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active">
                        {activeReports.length > 0 ? (
                            <ReportsTable reports={activeReports} tab="active"/>
                        ) : (
                            <NoEntriesView tab="active" />
                        )}
                    </TabsContent>
                    <TabsContent value="pending">
                        {pendingReports.length > 0 ? (
                            <ReportsTable reports={pendingReports} tab="pending" />
                        ) : (
                             <NoEntriesView tab="pending" />
                        )}
                    </TabsContent>
                    <TabsContent value="deleted">
                        {deletedReports.length > 0 ? (
                            <ReportsTable reports={deletedReports} tab="deleted" />
                        ) : (
                            <NoEntriesView tab="deleted" />
                        )}
                    </TabsContent>
                </Tabs>
            )}
          </CardContent>
        </Card>
    </>
  );
}
