
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
import { Loader2, ShieldAlert, Users, FileText, AlertTriangle, Trash2, Eye, MoreHorizontal, BarChart3, UserCheck, UserX, UserCog, CalendarDays, Building2, Tag, MessageSquare, Image as ImageIcon, CheckCircle2, CreditCard, Send, Briefcase, MapPin, Phone, Mail, ShieldCheck as ShieldCheckIcon, User as UserIcon, Globe } from "lucide-react";
import type { UserProfile, Report, ReportCategoryValue } from "@/types";
import { getAllUsers, saveAllUsers, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports, countries } from "@/types";
import { format as formatDateFn, addYears } from 'date-fns';
import { lt } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Label } from "@/components/ui/label";

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

const DESTRUCTIVE_REPORT_CATEGORIES: ReportCategoryValue[] = ['kuro_vagyste', 'neblaivumas_darbe', 'technikos_pazeidimai', 'avaringumas'];

const getNationalityLabel = (nationalityCode?: string) => {
    if (!nationalityCode) return "Nenurodyta";
    const country = countries.find(c => c.value === nationalityCode);
    return country ? country.label : nationalityCode;
};

export default function AdminPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allUsersState, setAllUsersState] = useState<UserProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<Report | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!adminUser || !adminUser.isAdmin)) {
      router.replace('/dashboard');
    }
    if (adminUser && adminUser.isAdmin) {
      const fetchedUsers = getAllUsers();
      setAllUsersState(fetchedUsers.sort((a,b) => (a.companyName || "").localeCompare(b.companyName || "")));
      
      const localReports = getReportsFromLocalStorage();
      const combined = combineAndDeduplicateReports(localReports, MOCK_GENERAL_REPORTS);
      setAllReports(combined.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsLoadingData(false);
    }
  }, [adminUser, authLoading, router]);

  const handleUserStatusChange = (userId: string, newStatus: UserProfile['paymentStatus']) => {
    const targetUser = allUsersState.find(u => u.id === userId);
    if (!targetUser) return;

    const oldStatus = targetUser.paymentStatus;
    let newAccountActivatedAt = targetUser.accountActivatedAt;

    if (newStatus === 'active' && oldStatus !== 'active') {
        newAccountActivatedAt = new Date().toISOString();
    }

    const updatedUsers = allUsersState.map(u => 
      u.id === userId ? { ...u, paymentStatus: newStatus, accountActivatedAt: newAccountActivatedAt } : u
    );
    setAllUsersState(updatedUsers);
    saveAllUsers(updatedUsers); 

    let toastTitle = "Vartotojo būsena pakeista";
    let toastDescription = `Vartotojo ${targetUser.companyName} (${targetUser.email}) būsena nustatyta į "${getStatusText(newStatus)}".`;

    if (newStatus === 'pending_payment' && oldStatus === 'pending_verification') {
        toastTitle = "Tapatybė patvirtinta";
        toastDescription = `Vartotojo ${targetUser.companyName} tapatybė patvirtinta. Būsena: Laukia apmokėjimo. Vartotojui 'išsiųstos' mokėjimo instrukcijos.`;
    } else if (newStatus === 'active' && oldStatus === 'pending_payment') {
        toastTitle = "Paskyra Aktyvuota";
        toastDescription = `Vartotojo ${targetUser.companyName} mokėjimas 'gautas'. Paskyra sėkmingai aktyvuota.`;
    } else if (newStatus === 'active' && oldStatus === 'pending_verification') {
        toastTitle = "Paskyra Patvirtinta ir Aktyvuota";
        toastDescription = `Vartotojo ${targetUser.companyName} paskyra patvirtinta ir aktyvuota. Vartotojui 'išsiųstos' instrukcijos.`;
    }


    toast({
      title: toastTitle,
      description: toastDescription,
      duration: 7000,
    });
  };

  const handleViewReportDetails = (report: Report) => {
    setSelectedReportForDetails(report);
  };

  const closeReportDetailsModal = () => {
    setSelectedReportForDetails(null);
  };

  const handleViewUserDetails = (user: UserProfile) => {
    setSelectedUserForDetails(user);
  };

  const closeUserDetailsModal = () => {
    setSelectedUserForDetails(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    setDeletingReportId(reportId); 
    await new Promise(resolve => setTimeout(resolve, 700));
    const updatedReports = allReports.filter(report => report.id !== reportId);
    setAllReports(updatedReports);
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


  if (authLoading || !adminUser || !adminUser.isAdmin || isLoadingData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const getStatusBadgeVariant = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending_verification': return 'secondary';
      case 'pending_payment': return 'outline'; 
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: UserProfile['paymentStatus']) => {
     switch (status) {
      case 'active': return 'Aktyvi';
      case 'pending_verification': return 'Laukia Tapatybės Patvirtinimo';
      case 'pending_payment': return 'Laukia Apmokėjimo';
      case 'inactive': return 'Neaktyvi';
      default: return status;
    }
  }

  const UserInfoField = ({ label, value, icon: Icon }: { label: string, value: string | boolean | undefined, icon: React.ElementType }) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-muted-foreground flex items-center">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Label>
      <p className="text-base text-foreground bg-secondary/30 p-2.5 rounded-md min-h-[40px] flex items-center">
        {typeof value === 'boolean' ? (value ? 'Taip' : 'Ne') : (value || "-")}
      </p>
    </div>
  );


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
              <CardTitle>Registruoti Vartotojai ({allUsersState.length})</CardTitle>
              <CardDescription>
                Platformoje registruotų įmonių (vartotojų) sąrašas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allUsersState.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Įmonės Pavadinimas</TableHead>
                      <TableHead className="hidden md:table-cell">Kontaktinis Asmuo</TableHead>
                      <TableHead className="hidden lg:table-cell">El. Paštas</TableHead>
                      <TableHead className="text-center">Būsena</TableHead>
                      <TableHead className="text-right">Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsersState.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.companyName}</TableCell>
                        <TableCell className="hidden md:table-cell">{u.contactPerson}</TableCell>
                        <TableCell className="hidden lg:table-cell">{u.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusBadgeVariant(u.paymentStatus)}>
                            {getStatusText(u.paymentStatus)}
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
                              <DropdownMenuItem onClick={() => handleViewUserDetails(u)}>
                                <Eye className="mr-2 h-4 w-4" /> Peržiūrėti Anketą
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Keisti Būseną</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {u.paymentStatus === 'pending_verification' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'pending_payment')}>
                                  <Send className="mr-2 h-4 w-4 text-blue-600" /> Patvirtinti tapatybę, Siųsti mok. instrukcijas
                                </DropdownMenuItem>
                              )}
                               {u.paymentStatus === 'pending_payment' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'active')}>
                                  <CreditCard className="mr-2 h-4 w-4 text-green-600" /> Aktyvuoti (Mokėjimas Gautas)
                                </DropdownMenuItem>
                              )}
                              {u.paymentStatus !== 'active' && u.paymentStatus !== 'pending_payment' && u.paymentStatus !== 'pending_verification' && ( 
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'active')}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Aktyvuoti
                                </DropdownMenuItem>
                              )}
                              {u.paymentStatus === 'active' && ( 
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'inactive')}>
                                  <UserX className="mr-2 h-4 w-4" /> Deaktyvuoti
                                </DropdownMenuItem>
                              )}
                               <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'pending_verification')} disabled={u.paymentStatus === 'pending_verification'}>
                                <UserCog className="mr-2 h-4 w-4" /> Nustatyti "Laukia Tapatybės Patvirtinimo"
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
                           <Badge variant={DESTRUCTIVE_REPORT_CATEGORIES.includes(report.category as ReportCategoryValue) ? 'destructive' : 'secondary'}>
                             {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{report.reporterCompanyName || "Nenurodyta"}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-muted-foreground">
                          {formatDateFn(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
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
                    <NextImage 
                        src={selectedReportForDetails.imageUrl}
                        alt={`Pranešimo nuotrauka ${selectedReportForDetails.fullName}`}
                        width={600}
                        height={400}
                        layout="responsive"
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
                <p className="text-base text-foreground">{formatDateFn(new Date(selectedReportForDetails.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: lt })}</p>
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

      {selectedUserForDetails && (
        <Dialog open={!!selectedUserForDetails} onOpenChange={(isOpen) => { if (!isOpen) closeUserDetailsModal(); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <UserIcon className="mr-2 h-5 w-5 text-primary" /> Vartotojo Anketos Detalės
              </DialogTitle>
              <DialogDescription>
                Išsami informacija apie vartotoją <span className="font-semibold">{selectedUserForDetails.companyName}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              <UserInfoField label="Įmonės Pavadinimas" value={selectedUserForDetails.companyName} icon={Building2} />
              <UserInfoField label="Įmonės Kodas" value={selectedUserForDetails.companyCode} icon={Briefcase} />
              <UserInfoField label="Adresas" value={selectedUserForDetails.address} icon={MapPin} />
              <UserInfoField label="Kontaktinis Asmuo" value={selectedUserForDetails.contactPerson} icon={UserIcon} />
              <UserInfoField label="El. Paštas" value={selectedUserForDetails.email} icon={Mail} />
              <UserInfoField label="Telefonas" value={selectedUserForDetails.phone} icon={Phone} />
              <div className="md:col-span-2">
                <UserInfoField label="Būsena" value={getStatusText(selectedUserForDetails.paymentStatus)} icon={CheckCircle2} />
              </div>
               {selectedUserForDetails.accountActivatedAt && selectedUserForDetails.paymentStatus === 'active' && (
                <div className="md:col-span-2">
                    <UserInfoField 
                        label="Paskyra Aktyvi Iki" 
                        value={formatDateFn(addYears(new Date(selectedUserForDetails.accountActivatedAt), 1), "yyyy-MM-dd")} 
                        icon={CalendarDays} 
                    />
                </div>
                )}
              <UserInfoField label="Administratorius" value={selectedUserForDetails.isAdmin} icon={ShieldAlert} />
              <UserInfoField label="Sutiko su taisyklėmis" value={selectedUserForDetails.agreeToTerms} icon={ShieldCheckIcon} />
              <div className="md:col-span-2">
                <UserInfoField label="Vartotojo ID" value={selectedUserForDetails.id} icon={UserCog} />
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
