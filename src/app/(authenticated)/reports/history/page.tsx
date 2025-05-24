
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report, ReportCategoryValue } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, History as HistoryIcon, User, CalendarDays, Tag, MessageSquare, AlertTriangle, Trash2, Eye, PlusCircle, Building2, Image as ImageIcon, FileText, Globe } from "lucide-react";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MOCK_USER, MOCK_USER_REPORTS, countries } from "@/types";

const LOCAL_STORAGE_REPORTS_KEY = 'driverShieldReports';
const DESTRUCTIVE_REPORT_CATEGORIES: ReportCategoryValue[] = ['kuro_vagyste', 'neblaivumas_darbe', 'zala_technikai', 'avaringumas'];

function getReportsFromLocalStorage(): Report[] {
  if (typeof window !== 'undefined') {
    const reportsJSON = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    if (reportsJSON) {
      return JSON.parse(reportsJSON).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
      }));
    }
  }
  return [];
}

function saveReportsToLocalStorage(reports: Report[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  }
}

export default function ReportHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      if (user) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const localUserReports = getReportsFromLocalStorage().filter(r => r.reporterId === user.id);
        let combinedReportsForUser = [...localUserReports];

        if (user.id === MOCK_USER.id) {
          const userSpecificMocks = MOCK_USER_REPORTS.filter(mr => mr.reporterId === user.id);
          userSpecificMocks.forEach(mockReport => {
            if (!combinedReportsForUser.some(lr => lr.id === mockReport.id)) {
              combinedReportsForUser.push(mockReport);
            }
          });
        }
        setReports(combinedReportsForUser.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
      setIsLoading(false);
    };
    if (user) {
      fetchReports();
    } else {
      setIsLoading(false);
      setReports([]);
    }
  }, [user]);

  const handleDeleteReport = async (reportId: string) => {
    setDeletingId(reportId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allLocalReports = getReportsFromLocalStorage();
    const updatedLocalReports = allLocalReports.filter(report => report.id !== reportId);
    saveReportsToLocalStorage(updatedLocalReports);

    setReports(prevReports => prevReports.filter(report => report.id !== reportId));

    toast({
      title: "Įrašas pašalintas",
      description: "Pasirinktas įrašas buvo sėkmingai pašalintas iš naršyklės atminties.",
    });
    setDeletingId(null);
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReportForDetails(report);
  };

  const closeDetailsModal = () => {
    setSelectedReportForDetails(null);
  };
  
  const getNationalityLabel = (nationalityCode?: string) => {
    if (!nationalityCode) return "Nenurodyta";
    const country = countries.find(c => c.value === nationalityCode);
    return country ? country.label : nationalityCode;
  };


  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
        <div className="container mx-auto py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Neprisijungęs vartotojas</h1>
            <p className="text-muted-foreground">Prašome prisijungti, kad matytumėte įrašų istoriją.</p>
            <Button asChild className="mt-4">
                <Link href="/auth/login">Prisijungti</Link>
            </Button>
        </div>
    );
  }

   if (isLoading) {
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
            <HistoryIcon className="mr-3 h-8 w-8 text-primary" />
            Mano Įrašų Istorija
          </h1>
          <p className="text-muted-foreground mt-1">Peržiūrėkite ir tvarkykite savo pateiktus įrašus.</p>
        </div>
        <Button asChild>
          <Link href="/reports/add">
            <PlusCircle className="mr-2 h-5 w-5" />
            Pridėti Naują Įrašą
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="shadow-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl">Įrašų Nerasta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Jūs dar nesate pateikę jokių įrašų.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/reports/add">Sukurti Pirmą Įrašą</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center mb-1">
                      <User className="mr-2 h-5 w-5 text-primary" />
                      {report.fullName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Pateikta: {format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
                    </CardDescription>
                  </div>
                  <Badge variant={DESTRUCTIVE_REPORT_CATEGORIES.includes(report.category as ReportCategoryValue) ? 'destructive' : 'secondary'}>
                    {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <p className="text-muted-foreground line-clamp-3"><MessageSquare className="inline h-4 w-4 mr-1.5 relative -top-0.5" />{report.comment}</p>
                {report.tags && report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {report.tags.map(tag => (
                      <Badge key={tag} variant="outline"><Tag className="inline h-3 w-3 mr-1" />{tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                    ))}
                  </div>
                )}
                 {report.imageUrl && (
                    <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Pridėtas failas (demonstracinė nuoroda):</p>
                        <Link href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-xs">
                           {report.imageUrl}
                        </Link>
                    </div>
                  )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                 <Button variant="ghost" size="sm" onClick={() => handleViewDetails(report)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Peržiūrėti (Detalės)
                  </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deletingId === report.id || report.reporterId !== user?.id}>
                      {deletingId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Pašalinti
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ar tikrai norite pašalinti šį įrašą?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Šis veiksmas yra negrįžtamas. Įrašas apie <span className="font-semibold">{report.fullName}</span> bus visam laikui pašalintas iš naršyklės atminties.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="bg-destructive hover:bg-destructive/90">
                        Taip, pašalinti
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedReportForDetails && (
        <Dialog open={!!selectedReportForDetails} onOpenChange={(isOpen) => { if (!isOpen) closeDetailsModal(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Įrašo Detalės
              </DialogTitle>
              <DialogDescription>
                Išsami informacija apie įrašą.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4" />Vairuotojas</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.fullName}</p>
              </div>
              {selectedReportForDetails.nationality && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Globe className="mr-2 h-4 w-4" />Pilietybė</h4>
                  <p className="text-base text-foreground">{getNationalityLabel(selectedReportForDetails.nationality)}</p>
                </div>
              )}
              {selectedReportForDetails.birthYear && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Gimimo Metai</h4>
                  <p className="text-base text-foreground">{selectedReportForDetails.birthYear}</p>
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />Kategorija</h4>
                <Badge variant={DESTRUCTIVE_REPORT_CATEGORIES.includes(selectedReportForDetails.category as ReportCategoryValue) ? 'destructive' : 'secondary'} className="text-sm">
                  {selectedReportForDetails.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              {selectedReportForDetails.tags && selectedReportForDetails.tags.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />Žymos</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReportForDetails.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-sm">{tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><MessageSquare className="mr-2 h-4 w-4" />Komentaras</h4>
                <p className="text-base text-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">{selectedReportForDetails.comment}</p>
              </div>
              {selectedReportForDetails.imageUrl && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><ImageIcon className="mr-2 h-4 w-4" />Pridėtas Failas/Nuotrauka</h4>
                  <div className="w-full overflow-hidden rounded-md border">
                    <Image
                        src={selectedReportForDetails.imageUrl}
                        alt={`Įrašo nuotrauka ${selectedReportForDetails.fullName}`}
                        width={600}
                        height={400}
                        layout="responsive"
                        objectFit="contain"
                        data-ai-hint={selectedReportForDetails.dataAiHint || "entry image"}
                    />
                  </div>
                </div>
              )}
               <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Building2 className="mr-2 h-4 w-4" />Pateikė Įmonė</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.reporterCompanyName || 'Nenurodyta'}</p>
              </div>
               <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Pateikimo Data</h4>
                <p className="text-base text-foreground">{format(new Date(selectedReportForDetails.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: lt })}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Uždaryti</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
