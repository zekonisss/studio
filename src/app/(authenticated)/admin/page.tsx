
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
import { Loader2, ShieldAlert, Users, FileText, AlertTriangle, Trash2, Eye, MoreHorizontal, BarChart3, UserCheck, UserX, UserCog, CalendarDays, Building2, Tag, MessageSquare, Image as ImageIcon, CheckCircle2, CreditCard, Send, Briefcase, MapPin, Phone, Mail, ShieldCheck as ShieldCheckIcon, User as UserIcon, Globe, Edit3, Save, XCircle, Percent, Layers } from "lucide-react";
import type { UserProfile, Report } from "@/types";
import { getAllUsers, saveAllUsers, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports, countries, detailedReportCategories, DESTRUCTIVE_REPORT_MAIN_CATEGORIES, getCategoryNameAdmin as getCategoryNameForDisplay } from "@/types";
import { format as formatDateFn, addYears } from 'date-fns';
import { lt, enUS } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/language-context';

const LOCAL_STORAGE_REPORTS_KEY = 'driverCheckReports'; 

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

const getNationalityLabel = (nationalityCode?: string, currentLocale?: string, translateFn?: (key: string) => string) => {
    if (!nationalityCode) return translateFn ? translateFn('common.notSpecified') : "Nenurodyta";
    const country = countries.find(c => c.value === nationalityCode);
    // Here you might want to implement translation for country names if needed
    return country ? country.label : nationalityCode;
};


export default function AdminPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allUsersState, setAllUsersState] = useState<UserProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<Report | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const [isEditingUserDetails, setIsEditingUserDetails] = useState(false);
  const [editingUserDetailsFormData, setEditingUserDetailsFormData] = useState<Partial<UserProfile>>({});

  const dateLocale = locale === 'en' ? enUS : lt;


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

    let toastTitle = t('admin.users.toast.statusChanged.title');
    let toastDescription = t('admin.users.toast.statusChanged.description', {
        companyName: targetUser.companyName,
        email: targetUser.email,
        status: getStatusText(newStatus)
    });


    if (newStatus === 'pending_payment' && oldStatus === 'pending_verification') {
        toastTitle = t('admin.users.toast.identityVerified.title');
        toastDescription = t('admin.users.toast.identityVerified.description', { companyName: targetUser.companyName });
    } else if (newStatus === 'active' && oldStatus === 'pending_payment') {
        toastTitle = t('admin.users.toast.accountActivated.title');
        toastDescription = t('admin.users.toast.accountActivated.description', { companyName: targetUser.companyName });
    } else if (newStatus === 'active' && oldStatus === 'pending_verification') {
        // This case means admin directly activates from pending_verification
        toastTitle = t('admin.users.toast.accountVerifiedAndActivated.title');
        toastDescription = t('admin.users.toast.accountVerifiedAndActivated.description', { companyName: targetUser.companyName });
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
    setEditingUserDetailsFormData({ 
      companyName: user.companyName,
      companyCode: user.companyCode,
      vatCode: user.vatCode,
      address: user.address,
      contactPerson: user.contactPerson,
      email: user.email,
      phone: user.phone,
    });
    setIsEditingUserDetails(false); 
  };

  const closeUserDetailsModal = () => {
    setSelectedUserForDetails(null);
    setIsEditingUserDetails(false);
    setEditingUserDetailsFormData({});
  };

  const handleEditUserDetails = () => {
    if (selectedUserForDetails) {
        setEditingUserDetailsFormData({
            companyName: selectedUserForDetails.companyName,
            companyCode: selectedUserForDetails.companyCode,
            vatCode: selectedUserForDetails.vatCode,
            address: selectedUserForDetails.address,
            contactPerson: selectedUserForDetails.contactPerson,
            email: selectedUserForDetails.email,
            phone: selectedUserForDetails.phone,
        });
        setIsEditingUserDetails(true);
    }
  };

  const handleUserDetailsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingUserDetailsFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUserDetails = () => {
    if (!selectedUserForDetails) return;

    const updatedUser: UserProfile = {
        ...selectedUserForDetails,
        companyName: editingUserDetailsFormData.companyName || selectedUserForDetails.companyName,
        companyCode: editingUserDetailsFormData.companyCode || selectedUserForDetails.companyCode,
        vatCode: editingUserDetailsFormData.vatCode || undefined,
        address: editingUserDetailsFormData.address || selectedUserForDetails.address,
        contactPerson: editingUserDetailsFormData.contactPerson || selectedUserForDetails.contactPerson,
        email: editingUserDetailsFormData.email || selectedUserForDetails.email,
        phone: editingUserDetailsFormData.phone || selectedUserForDetails.phone,
    };

    const updatedUsersList = allUsersState.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsersState(updatedUsersList);
    saveAllUsers(updatedUsersList);
    setSelectedUserForDetails(updatedUser); 
    setIsEditingUserDetails(false);
    toast({
        title: t('admin.users.toast.dataUpdated.title'),
        description: t('admin.users.toast.dataUpdated.description', { companyName: updatedUser.companyName }),
    });
  };

  const handleCancelEditUserDetails = () => {
    setIsEditingUserDetails(false);
    if (selectedUserForDetails) {
      setEditingUserDetailsFormData({ 
        companyName: selectedUserForDetails.companyName,
        companyCode: selectedUserForDetails.companyCode,
        vatCode: selectedUserForDetails.vatCode,
        address: selectedUserForDetails.address,
        contactPerson: selectedUserForDetails.contactPerson,
        email: selectedUserForDetails.email,
        phone: selectedUserForDetails.phone,
      });
    }
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
      title: t('admin.entries.toast.entryDeleted.title'),
      description: t('admin.entries.toast.entryDeleted.description'),
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
      case 'active': return t('admin.users.status.active');
      case 'pending_verification': return t('admin.users.status.pending_verification');
      case 'pending_payment': return t('admin.users.status.pending_payment');
      case 'inactive': return t('admin.users.status.inactive');
      default: return status;
    }
  }

  const UserInfoField = ({ label, value, icon: Icon, name, isEditing, onChange }: { label: string, value: string | boolean | undefined, icon: React.ElementType, name?: string, isEditing?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium text-muted-foreground flex items-center">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Label>
      {isEditing && name && typeof value === 'string' && onChange ? (
        <Input id={name} name={name} value={value} onChange={onChange} className="text-base" />
      ) : (
        <p className="text-base text-foreground bg-secondary/30 p-2.5 rounded-md min-h-[40px] flex items-center">
          {typeof value === 'boolean' ? (value ? t('common.yes') : t('common.no')) : (value || t('common.notSpecified'))}
        </p>
      )}
    </div>
  );


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
          {t('admin.pageTitle')}
        </h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="users" className="text-base py-2.5">
            <Users className="mr-2 h-5 w-5" /> {t('admin.tabs.userManagement')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">
            <FileText className="mr-2 h-5 w-5" /> {t('admin.tabs.entryManagement')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-base py-2.5">
            <BarChart3 className="mr-2 h-5 w-5" /> {t('admin.tabs.statistics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.users.title')} ({allUsersState.length})</CardTitle>
              <CardDescription>
                {t('admin.users.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allUsersState.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.table.companyName')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('admin.users.table.contactPerson')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('admin.users.table.email')}</TableHead>
                      <TableHead className="text-center">{t('admin.users.table.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
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
                                <span className="sr-only">{t('admin.users.actions.userActions')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUserDetails(u)}>
                                <Eye className="mr-2 h-4 w-4" /> {t('admin.users.actions.viewProfile')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>{t('admin.users.actions.changeStatus')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {u.paymentStatus === 'pending_verification' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'pending_payment')}>
                                  <Send className="mr-2 h-4 w-4 text-blue-600" /> {t('admin.users.actions.verifyAndSendPayment')}
                                </DropdownMenuItem>
                              )}
                               {u.paymentStatus === 'pending_payment' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'active')}>
                                  <CreditCard className="mr-2 h-4 w-4 text-green-600" /> {t('admin.users.actions.activatePaymentReceived')}
                                </DropdownMenuItem>
                              )}
                              {u.paymentStatus !== 'active' && u.paymentStatus !== 'pending_payment' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'active')}>
                                  <UserCheck className="mr-2 h-4 w-4" /> {t('admin.users.actions.activate')}
                                </DropdownMenuItem>
                              )}
                              {u.paymentStatus === 'active' && (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'inactive')}>
                                  <UserX className="mr-2 h-4 w-4" /> {t('admin.users.actions.deactivate')}
                                </DropdownMenuItem>
                              )}
                               <DropdownMenuItem onClick={() => handleUserStatusChange(u.id, 'pending_verification')} disabled={u.paymentStatus === 'pending_verification'}>
                                <UserCog className="mr-2 h-4 w-4" /> {t('admin.users.actions.setPendingVerification')}
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
                    <p className="text-muted-foreground">{t('admin.users.noUsersFound')}</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.entries.title')} ({allReports.length})</CardTitle>
              <CardDescription>
                {t('admin.entries.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.entries.table.personInEntry')}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('admin.entries.table.category')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('admin.entries.table.submittedByCompany')}</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">{t('admin.entries.table.submissionDate')}</TableHead>
                      <TableHead className="text-right">{t('admin.entries.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.fullName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                           <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'}>
                             {getCategoryNameForDisplay(report.category, t)}
                           </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{report.reporterCompanyName || t('common.notSpecified')}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-muted-foreground">
                          {formatDateFn(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleViewReportDetails(report)} title={t('admin.entries.actions.viewDetails')}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title={t('admin.entries.actions.deleteEntry')} disabled={deletingReportId === report.id}>
                                  {deletingReportId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('admin.entries.deleteDialog.title')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                   {t('admin.entries.deleteDialog.description.part1')} <span className="font-semibold">{report.fullName}</span> {t('admin.entries.deleteDialog.description.part2')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="bg-destructive hover:bg-destructive/90">
                                    {t('admin.entries.deleteDialog.confirmDelete')}
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
                    <p className="text-muted-foreground">{t('admin.entries.noEntriesFound')}</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="stats">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.statistics.title')}</CardTitle>
              <CardDescription>
                {t('admin.statistics.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('admin.statistics.notImplemented')}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t('admin.statistics.futureImplementation')}</p>
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
                <FileText className="mr-2 h-5 w-5 text-primary" /> {t('admin.entryDetailsModal.title')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.entryDetailsModal.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><UserIcon className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.driver')}</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.fullName}</p>
              </div>
               {selectedReportForDetails.nationality && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Globe className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.nationality')}</h4>
                  <p className="text-base text-foreground">{getNationalityLabel(selectedReportForDetails.nationality, locale, t)}</p>
                </div>
              )}
              {selectedReportForDetails.birthYear && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.birthYear')}</h4>
                  <p className="text-base text-foreground">{selectedReportForDetails.birthYear}</p>
                </div>
              )}
              <div className="space-y-1">
                 <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Layers className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.mainCategory')}</h4>
                <Badge 
                    variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(selectedReportForDetails.category) ? 'destructive' : 'secondary'} 
                    className="text-sm">
                  {getCategoryNameForDisplay(selectedReportForDetails.category, t)}
                </Badge>
              </div>
              {selectedReportForDetails.tags && selectedReportForDetails.tags.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.tags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReportForDetails.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><MessageSquare className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.comment')}</h4>
                <p className="text-base text-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">{selectedReportForDetails.comment}</p>
              </div>
              {selectedReportForDetails.imageUrl && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><ImageIcon className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.attachedFile')}</h4>
                  <div className="w-full overflow-hidden rounded-md border">
                    <NextImage
                        src={selectedReportForDetails.imageUrl}
                        alt={t('admin.entryDetailsModal.imageAltPrefix', { fullName: selectedReportForDetails.fullName })}
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
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Building2 className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.submittedByCompany')}</h4>
                <p className="text-base text-foreground">{selectedReportForDetails.reporterCompanyName || t('common.notSpecified')}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.submitterId')}</h4>
                <p className="text-xs text-foreground bg-secondary/30 p-2 rounded-md">{selectedReportForDetails.reporterId}</p>
              </div>
               <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.submissionDate')}</h4>
                <p className="text-base text-foreground">{formatDateFn(new Date(selectedReportForDetails.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: dateLocale })}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('common.close')}</Button>
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
                <UserIcon className="mr-2 h-5 w-5 text-primary" /> {t('admin.userDetailsModal.title')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.userDetailsModal.description.part1')} <span className="font-semibold">{isEditingUserDetails ? editingUserDetailsFormData.companyName : selectedUserForDetails.companyName}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              <UserInfoField label={t('admin.userDetailsModal.companyName')} value={isEditingUserDetails ? editingUserDetailsFormData.companyName || "" : selectedUserForDetails.companyName} icon={Building2} name="companyName" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.companyCode')} value={isEditingUserDetails ? editingUserDetailsFormData.companyCode || "" : selectedUserForDetails.companyCode} icon={Briefcase} name="companyCode" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.vatCode')} value={isEditingUserDetails ? editingUserDetailsFormData.vatCode || "" : selectedUserForDetails.vatCode} icon={Percent} name="vatCode" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.address')} value={isEditingUserDetails ? editingUserDetailsFormData.address || "" : selectedUserForDetails.address} icon={MapPin} name="address" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.contactPerson')} value={isEditingUserDetails ? editingUserDetailsFormData.contactPerson || "" : selectedUserForDetails.contactPerson} icon={UserIcon} name="contactPerson" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.email')} value={isEditingUserDetails ? editingUserDetailsFormData.email || "" : selectedUserForDetails.email} icon={Mail} name="email" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />
              <UserInfoField label={t('admin.userDetailsModal.phone')} value={isEditingUserDetails ? editingUserDetailsFormData.phone || "" : selectedUserForDetails.phone} icon={Phone} name="phone" isEditing={isEditingUserDetails} onChange={handleUserDetailsInputChange} />

              <div className="md:col-span-2">
                <UserInfoField label={t('admin.userDetailsModal.status')} value={getStatusText(selectedUserForDetails.paymentStatus)} icon={CheckCircle2} />
              </div>
               {selectedUserForDetails.accountActivatedAt && selectedUserForDetails.paymentStatus === 'active' && (
                <div className="md:col-span-2">
                    <UserInfoField
                        label={t('admin.userDetailsModal.accountActiveUntil')}
                        value={formatDateFn(addYears(new Date(selectedUserForDetails.accountActivatedAt), 1), "yyyy-MM-dd", { locale: dateLocale })}
                        icon={CalendarDays}
                    />
                </div>
                )}
              <UserInfoField label={t('admin.userDetailsModal.administrator')} value={selectedUserForDetails.isAdmin} icon={ShieldAlert} />
              <UserInfoField label={t('admin.userDetailsModal.agreedToTerms')} value={selectedUserForDetails.agreeToTerms} icon={ShieldCheckIcon} />
              <div className="md:col-span-2">
                <UserInfoField label={t('admin.userDetailsModal.userId')} value={selectedUserForDetails.id} icon={UserCog} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                {isEditingUserDetails ? (
                    <>
                        <Button type="button" variant="outline" onClick={handleCancelEditUserDetails}>
                           <XCircle className="mr-2 h-4 w-4" /> {t('common.cancel')}
                        </Button>
                        <Button type="button" onClick={handleSaveUserDetails}>
                           <Save className="mr-2 h-4 w-4" /> {t('common.saveChanges')}
                        </Button>
                    </>
                ) : (
                    <Button type="button" variant="outline" onClick={handleEditUserDetails}>
                       <Edit3 className="mr-2 h-4 w-4" /> {t('common.editData')}
                    </Button>
                )}
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={closeUserDetailsModal}>{t('common.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
