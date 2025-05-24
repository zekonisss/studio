
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ShieldAlert, Users, FileText, AlertTriangle, Trash2, Eye, MoreHorizontal, BarChart3, UserCheck, UserX, UserCog, CalendarDays, Building2, Tag, MessageSquare, Image as ImageIcon } from "lucide-react";
import type { UserProfile, Report } from "@/types";
import { MOCK_ALL_USERS as initialMockUsers, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports } from "@/types";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image"; // Renamed to avoid conflict with Lucide's Image icon

const LOCAL_STORAGE_REPORTS_KEY = 'driverShieldReports';

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

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [mockUsers, setMockUsers] = useState<UserProfile[]>(initialMockUsers);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<Report | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.replace('/dashboard');
    }
    if (user && user.isAdmin) {
      const localReports = getReportsFromLocalStorage();
      const combined = combineAndDeduplicateReports(localReports, MOCK_GENERAL_REPORTS);
      setAllReports(combined.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsLoadingData(false);
    }
  }, [user, authLoading, router]);

  const handleUserStatusChange = (userId: string, newStatus: UserProfile['paymentStatus']) => {
    setMockUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, paymentStatus: newStatus } : u))
    );
    const targetUser = mockUsers.find(u=>u.id === userId);
    toast({
      title: "Vartotojo būsena pakeista",
      description: `Vartotojo ${targetUser?.companyName} būsena nustatyta į "${newStatus === 'active' ? 'Aktyvi' : newStatus === 'inactive' ? 'Neaktyvi' : 'Laukiama patvirtinimo'}".`,
    });
  };

  const handleViewReportDetails = (report: Report) => {
    setSelectedReportForDetails(report);
  };

  const closeReportDetailsModal = () => {
    setSelectedReportForDetails(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    setDeletingReportId(reportId); // For loading state on button
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));

    const updatedReports = allReports.filter(report => report.id !== reportId);
    setAllReports(updatedReports);

    // Also remove from localStorage if it exists there
    const localReports = getReportsFromLocalStorage();
    const updatedLocalReports = localReports.filter(report => report.id !== reportId);
    if (localReports.length !== updatedLocalReports.length) {
      saveReportsToLocalStorage(updatedLocalReports);
    }
    
    toast({
      title: "Pranešimas pašalintas",
      description: "Pasirinktas pranešimas buvo sėkmingai pašalintas.",
    });
    setDeletingReportId(null);
  };


  if (authLoading || !user || !user.isAdmin || isLoadingData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
          Administratoriaus Skydas
        </h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="users" className="text-base py-2.5">
            <Users className="mr-2 h-5 w-5" /> Vartotojų Valdymas
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">
            <FileText className="mr-2 h-5 w-5" /> Pranešimų Valdymas
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-base py-2.5">
            <BarChart3 className="mr-2 h-5 w-5" /> Statistika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Registruoti Vartotojai ({mockUsers.length})</CardTitle>
              <CardDescription>
                Platformoje registruotų įmonių (vartotojų) sąrašas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Įmonės Pavadinimas</TableHead>
                      <TableHead className="hidden md:table-cell">Kontaktinis Asmuo</TableHead>
                      <TableHead className="hidden lg:table-cell">El. Paštas</TableHead>
                      <TableHead className="text-center">Mokėjimo Būsena</TableHead>
                      <TableHead className="text-right">Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.companyName}</TableCell>
                        <TableCell className="hidden md:table-cell">{u.contactPerson}</TableCell>
                        <TableCell className="hidden lg:table-cell">{u.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={u.paymentStatus === 'active' ? 'default' : (u.paymentStatus === 'pending_verification' ? 'secondary' : 'destructive')}>
                            {u.paymentStatus === 'active' ? 'Aktyvi' : (u.paymentStatus === 'pending_verification' ? 'Laukiama patv.' : 'Neaktyvi')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Vartotojo veiksmai</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Keisti Būseną</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'active')} disabled={u.paymentStatus === 'active'}>
                                <UserCheck className="mr-2 h-4 w-4" /> Aktyvuoti
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'inactive')} disabled={u.paymentStatus === 'inactive'}>
                                 <UserX className="mr-2 h-4 w-4" /> Deaktyvuoti
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'pending_verification')} disabled={u.paymentStatus === 'pending_verification'}>
                                <UserCog className="mr-2 h-4 w-4" /> Nustatyti "Laukiama patvirtinimo"
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Vartotojų nerasta.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Visi Pranešimai ({allReports.length})</CardTitle>
              <CardDescription>
                Visų vartotojų pateikti pranešimai sistemoje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praneštas Asmuo</TableHead>
                      <TableHead className="hidden sm:table-cell">Kategorija</TableHead>
                      <TableHead className="hidden md:table-cell">Pateikė Įmonė</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Data</TableHead>
                      <TableHead className="text-right">Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.fullName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                           <Badge variant={report.category === 'kuro_vagyste' || report.category === 'zala_technikai' ? 'destructive' : 'secondary'}>
                             {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{report.reporterCompanyName || "Nenurodyta"}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-muted-foreground">
                          {format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleViewReportDetails(report)} title="Peržiūrėti detales">
                                <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Šalinti pranešimą" disabled={deletingReportId === report.id}>
                                  {deletingReportId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ar tikrai norite pašalinti šį pranešimą?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Šis veiksmas yra negrįžtamas. Pranešimas apie <span className="font-semibold">{report.fullName}</span> bus visam laikui pašalintas.
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Pranešimų nerasta.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="stats">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Statistika</CardTitle>
              <CardDescription>
                Sistemos naudojimo statistika (bus įgyvendinta vėliau).
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Prisijungimų ir kitos veiklos statistikos rodymas šiuo metu nėra įgyvendintas.</p>
                  <p className="text-sm text-muted-foreground mt-2">Ateityje čia galėsite matyti detalią informaciją apie vartotojų aktyvumą.</p>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {selectedReportForDetails && (
        <Dialog open={!!selectedReportForDetails} onOpenChange={(isOpen) => { if (!isOpen) closeReportDetailsModal(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Pranešimo Detalės
              </DialogTitle>
              <DialogDescription>
                Išsami informacija apie administratoriaus peržiūrimą pranešimą.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" />Vairuotojas</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.fullName}</p>
              </div>
              {selectedReportForDetails.birthYear && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Gimimo Metai</h4>
                  <p className="text-base text-foreground">{selectedReportForDetails.birthYear}</p>
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />Kategorija</h4>
                <Badge variant={selectedReportForDetails.category === 'kuro_vagyste' || selectedReportForDetails.category === 'zala_technikai' ? 'destructive' : 'secondary'} className="text-sm">
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
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <NextImage // Use NextImage
                        src={selectedReportForDetails.imageUrl}
                        alt={`Pranešimo nuotrauka ${selectedReportForDetails.fullName}`}
                        layout="fill"
                        objectFit="contain"
                        data-ai-hint={selectedReportForDetails.dataAiHint || "report image"}
                    />
                  </div>
                </div>
              )}
               <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Building2 className="mr-2 h-4 w-4" />Pranešė Įmonė</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.reporterCompanyName || 'Nenurodyta'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" />Pranešėjo ID</h4>
                <p className="text-xs text-foreground bg-secondary/30 p-2 rounded-md">{selectedReportForDetails.reporterId}</p>
              </div>
               <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />Pranešimo Data</h4>
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
