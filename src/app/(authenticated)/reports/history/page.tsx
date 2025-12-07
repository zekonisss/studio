"use client";
import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';
import type { Report } from '@/types';
import { getUserReports, softDeleteReport } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FilePlus2, Loader2, Inbox } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReportCard } from './_components/report-card';
import { ReportDetailsModal } from './_components/report-details-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ReportsHistoryPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();

    const [activeReports, setActiveReports] = useState<Report[]>([]);
    const [deletedReports, setDeletedReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const { active, deleted } = await getUserReports(user.id);
                setActiveReports(active);
                setDeletedReports(deleted);
            } catch (error) {
                console.error("Error fetching user reports:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    const handleViewDetails = (report: Report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!reportToDelete) return;

        setIsDeleting(true);
        try {
            await softDeleteReport(reportToDelete.id);
            toast({
                title: t('reports.history.toast.deleted.title'),
                description: t('reports.history.toast.deleted.description'),
            });
            setActiveReports(prev => prev.filter(r => r.id !== reportToDelete.id));
            setDeletedReports(prev => [reportToDelete, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Error deleting report:", error);
        } finally {
            setIsDeleting(false);
            setReportToDelete(null);
        }
    };
    
    const NoEntriesView = ({ isDeletedTab = false }: { isDeletedTab?: boolean }) => (
        <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg mt-6">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {isDeletedTab ? t('account.entries.noDeletedEntries') : t('reports.history.noEntries.title')}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDeletedTab ? t('account.entries.deletedDescription') : t('reports.history.noEntries.message')}
            </p>
            {!isDeletedTab && (
              <Button asChild className="mt-6">
                <Link href="/reports/add">
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  {t('reports.history.noEntries.createFirstButton')}
                </Link>
              </Button>
            )}
        </div>
    );

    return (
        <>
            <ReportDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                report={selectedReport}
            />

            <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('reports.history.deleteDialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                       {t('reports.history.deleteDialog.description', { fullName: reportToDelete?.fullName || '' })}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('reports.history.deleteDialog.confirmButton')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <History className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>{t('reports.history.pageTitle')}</CardTitle>
                                <CardDescription>{t('reports.history.pageDescription')}</CardDescription>
                            </div>
                        </div>
                         <Button asChild>
                            <Link href="/reports/add">
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                {t('reports.history.addNewButton')}
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : (
                             <Tabs defaultValue="active" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="active">{t('account.tabs.myEntries')} ({activeReports.length})</TabsTrigger>
                                    <TabsTrigger value="deleted">{t('account.entries.deletedTitle')} ({deletedReports.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="active">
                                   {activeReports.length > 0 ? (
                                        <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
                                            {activeReports.map(report => (
                                                <ReportCard 
                                                    key={report.id} 
                                                    report={report}
                                                    onViewDetails={() => handleViewDetails(report)}
                                                    onDelete={() => setReportToDelete(report)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <NoEntriesView />
                                    )}
                                </TabsContent>
                                <TabsContent value="deleted">
                                    {deletedReports.length > 0 ? (
                                        <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
                                            {deletedReports.map(report => (
                                                <ReportCard 
                                                    key={report.id} 
                                                    report={report}
                                                    onViewDetails={() => handleViewDetails(report)}
                                                    isDeleted={true}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <NoEntriesView isDeletedTab={true} />
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
