"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, History, AlertTriangle, FilePlus2, Trash2, Eye, FileText, Globe, CalendarDays as CalendarIcon, Tag, MessageSquare, Image as ImageIcon, Building, Archive } from "lucide-react";
import { format as formatDateFn } from 'date-fns';
import { lt, enUS } from 'date-fns/locale'; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as storage from '@/lib/storage';
import { useLanguage } from "@/contexts/language-context";
import { getCategoryNameForDisplay } from "@/lib/utils";
import { countries, DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import NextImage from "next/image";

export default function ReportsHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  
  const [activeReports, setActiveReports] = useState<Report[]>([]);
  const [deletedReports, setDeletedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  const dateLocale = locale === 'en' ? enUS : lt;

  const fetchUserReports = useCallback(async () => {
    if (!user) {
      setActiveReports([]);
      setDeletedReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { active, deleted } = await storage.getUserReports(user.id);
      setActiveReports(active);
      setDeletedReports(deleted);
    } catch(error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
        fetchUserReports();
    }
  }, [user, authLoading, fetchUserReports]);
  
  const handleDelete = async (reportId: string) => {
    await storage.softDeleteReport(reportId);
    await fetchUserReports(); // Re-fetch all reports to update both lists
  };

  const getNationalityLabel = (nationalityCode?: string) => {
    if (!nationalityCode) return t('common.notSpecified');
    const country = countries.find(c => c.value === nationalityCode);
    return country ? t('countries.' + country.value) : nationalityCode;
  };

  const getSafeDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
      return dateValue;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const formatDateSafe = (date: any) => {
      const safeDate = getSafeDate(date);
      if (!safeDate) return 'N/A';
      return formatDateFn(safeDate, "yyyy-MM-dd HH:mm", { locale: dateLocale });
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <History className="mr-3 h-8 w-8 text-primary" />
            {t('reports.history.pageTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('reports.history.pageDescription')}</p>
        </div>
         <Button asChild>
          <Link href="/reports/add">
            <FilePlus2 className="mr-2 h-5 w-5" />
            {t('reports.history.addNewButton')}
          </Link>
        </Button>
      </div>

      {activeReports.length === 0 && deletedReports.length === 0 ? (
         <Card className="shadow-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl">{t('reports.history.noEntries.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t('reports.history.noEntries.message')}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/reports/add">{t('reports.history.noEntries.createFirstButton')}</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="shadow-xl">
             <CardHeader>
              <CardTitle className="text-xl flex items-center"><FileText className="mr-2 text-primary" /> Aktyvūs įrašai ({activeReports.length})</CardTitle>
              <CardDescription>Jūsų pateikti ir sistemoje matomi įrašai.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeReports.map(report => (
                <div key={report.id} className="border p-4 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <h4 className="font-semibold text-lg">{report.fullName}</h4>
                    <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'} className="mt-2 sm:mt-0">
                      {getCategoryNameForDisplay(report.category, t)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{report.comment}</p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 text-xs text-muted-foreground">
                    <span>{t('reports.history.entry.submittedOn')}: {formatDateSafe(report.createdAt)}</span>
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="mr-2 h-4 w-4" /> {t('reports.history.entry.viewDetailsButton')}
                          </Button>
                        </DialogTrigger>
                        {selectedReport && selectedReport.id === report.id && (
                           <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="flex items-center text-xl">
                                  <FileText className="mr-2 h-5 w-5 text-primary" />
                                  {t('reports.history.detailsModal.title')}
                                </DialogTitle>
                                <DialogDescription>{t('reports.history.detailsModal.description')}</DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Building className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.driver')}</h4>
                                    <p className="text-base text-foreground">{selectedReport.fullName}</p>
                                  </div>
                                  {selectedReport.nationality && (
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Globe className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.nationality')}</h4>
                                      <p className="text-base text-foreground">{getNationalityLabel(selectedReport.nationality)}</p>
                                    </div>
                                  )}
                                  {selectedReport.birthYear && (
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.birthYear')}</h4>
                                      <p className="text-base text-foreground">{selectedReport.birthYear}</p>
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><FileText className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.mainCategory')}</h4>
                                    <Badge
                                      variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(selectedReport.category) ? 'destructive' : 'secondary'}
                                      className="text-sm">
                                      {getCategoryNameForDisplay(selectedReport.category, t)}
                                    </Badge>
                                  </div>
                                  {selectedReport.tags && selectedReport.tags.length > 0 && (
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.tags')}</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedReport.tags.map(tagKey => (
                                          <Badge key={tagKey} variant="outline" className="text-sm">{t('tags.' + tagKey)}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><MessageSquare className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.comment')}</h4>
                                    <p className="text-base text-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">{selectedReport.comment}</p>
                                  </div>
                                  {selectedReport.imageUrl && (
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-muted-foreground flex items-center"><ImageIcon className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.attachedFile')}</h4>
                                      <div className="w-full overflow-hidden rounded-md border">
                                        <NextImage
                                          src={selectedReport.imageUrl}
                                          alt={t('reports.history.detailsModal.imageAlt', { fullName: selectedReport.fullName })}
                                          width={600}
                                          height={400}
                                          layout="responsive"
                                          objectFit="contain"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Building className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.submittedByCompany')}</h4>
                                    <p className="text-base text-foreground">{selectedReport.reporterCompanyName || t('common.notSpecified')}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="mr-2 h-4 w-4" />{t('reports.history.detailsModal.submissionDate')}</h4>
                                    <p className="text-base text-foreground">{formatDateSafe(selectedReport.createdAt)}</p>
                                  </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline" onClick={() => setSelectedReport(null)}>{t('common.close')}</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          )}
                      </Dialog>
                     
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> {t('reports.history.entry.deleteButton')}
                          </Button>
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
                            <AlertDialogAction onClick={() => handleDelete(report.id)} className="bg-destructive hover:bg-destructive/90">
                              {t('reports.history.deleteDialog.confirmButton')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
               {activeReports.length === 0 && <p className="text-muted-foreground text-center py-4">Aktyvių įrašų nėra.</p>}
            </CardContent>
          </Card>

           <Card className="shadow-xl opacity-80">
             <CardHeader>
              <CardTitle className="text-xl flex items-center"><Archive className="mr-2 text-primary" /> Ištrinti įrašai ({deletedReports.length})</CardTitle>
              <CardDescription>Jūsų ištrinti įrašai. Jie nėra matomi paieškoje.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deletedReports.map(report => (
                <div key={report.id} className="border p-4 rounded-lg bg-muted/40">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <h4 className="font-semibold text-lg text-muted-foreground line-through">{report.fullName}</h4>
                    <Badge variant="outline">
                      {getCategoryNameForDisplay(report.category, t)}
                    </Badge>
                  </div>
                   <p className="text-muted-foreground text-sm mt-3">Ištrinta: {formatDateSafe(report.deletedAt!)}</p>
                </div>
              ))}
               {deletedReports.length === 0 && <p className="text-muted-foreground text-center py-4">Ištrintų įrašų nėra.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
