
"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from 'react';
import type { Report } from '@/types';
import * as storage from '@/lib/storage';
import { Skeleton } from "@/components/ui/skeleton";
import { FileWarning, FilePlus2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getCategoryNameForDisplay, migrateTagIfNeeded } from "@/lib/utils";
import Image from "next/image";

export default function ReportsHistoryPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();

    const [userReports, setUserReports] = useState<{ active: Report[], deleted: Report[] }>({ active: [], deleted: [] });
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        if (user) {
            setLoading(true);
            try {
                const reports = await storage.getUserReports(user.id);
                setUserReports(reports);
            } catch (error) {
                console.error("Error fetching user reports:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchReports();
    }, [user]);

    const handleDelete = async (reportId: string, fullName: string) => {
        try {
            await storage.softDeleteReport(reportId);
            toast({
                title: t('reports.history.toast.deleted.title'),
                description: t('reports.history.toast.deleted.description', { fullName }),
            });
            fetchReports(); // Re-fetch reports to update the lists
        } catch (error) {
            console.error("Error deleting report:", error);
            toast({
                variant: 'destructive',
                title: "Klaida",
                description: "Nepavyko ištrinti įrašo."
            });
        }
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(t('common.localeForDate'), { dateStyle: 'long' }).format(date);
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{t('reports.history.pageTitle')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('reports.history.pageDescription')}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/reports/add">
                        <FilePlus2 className="mr-2" />
                        {t('reports.history.addNewButton')}
                    </Link>
                </Button>
            </div>
            
            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : userReports.active.length > 0 ? (
                <div className="space-y-6">
                    {userReports.active.map((report) => (
                         <Card key={report.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span>{report.fullName}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">{t('reports.history.entry.deleteButton')}</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('reports.history.deleteDialog.title')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('reports.history.deleteDialog.description', { fullName: report.fullName })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(report.id, report.fullName)}>
                                                    {t('reports.history.deleteDialog.confirmButton')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardTitle>
                                <CardDescription>{t('reports.history.entry.submittedOn')}: {formatDate(report.createdAt as Date)}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                     <Badge>{getCategoryNameForDisplay(report.category, t)}</Badge>
                                    {report.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{t(`tags.${migrateTagIfNeeded(tag)}`)}</Badge>
                                    ))}
                                </div>
                                <p className="text-sm text-foreground/80">{report.comment}</p>
                                 {report.imageUrls && report.imageUrls.length > 0 && (
                                     <a href={report.imageUrls[0]} target="_blank" rel="noopener noreferrer" className="block w-fit">
                                        <Image 
                                            src={report.imageUrls[0]} 
                                            alt={t('search.results.imageAlt', { fullName: report.fullName })}
                                            width={150} 
                                            height={100}
                                            className="rounded-md object-cover border hover:opacity-80 transition-opacity"
                                        />
                                     </a>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="w-full py-20 flex flex-col items-center justify-center">
                    <FileWarning className="w-16 h-16 text-muted-foreground" />
                    <CardTitle className="mt-6">{t('reports.history.noEntries.title')}</CardTitle>
                    <CardDescription className="mt-2 max-w-md text-center">
                        {t('reports.history.noEntries.message')}
                    </CardDescription>
                    <Button asChild className="mt-6">
                        <Link href="/reports/add">{t('reports.history.noEntries.createFirstButton')}</Link>
                    </Button>
                </Card>
            )}
        </div>
    );
}
