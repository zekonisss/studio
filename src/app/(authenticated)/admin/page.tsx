"use client";

import { useEffect, useState, useMemo, Fragment, useCallback } from "react"; 
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
import { Loader2, ShieldAlert, Users, FileText, AlertTriangle, Trash2, Eye, MoreHorizontal, BarChart3, UserCheck, UserX, UserCog, CalendarDays, Building2, Tag, MessageSquare, Image as ImageIcon, CheckCircle2, CreditCard, Send, Briefcase, MapPin, Phone, Mail, ShieldCheck as ShieldCheckIcon, User as UserIcon, Globe, Edit3, Save, XCircle, Percent, Layers, ChevronLeft, ChevronRight, Activity, ListFilter, Trash } from "lucide-react";
import type { UserProfile, Report, AuditLogEntry } from "@/types";
import { countries, detailedReportCategories, DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";
import * as storage from '@/lib/storage';
import { format as formatDateFn, addYears } from 'date-fns';
import { lt, enUS } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/language-context';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const USERS_PER_PAGE = 10; 

export default function AdminPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allUsersState, setAllUsersState] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<Report | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isDeletingAllReports, setIsDeletingAllReports] = useState(false);

  const [isEditingUserDetails, setIsEditingUserDetails] = useState(false);
  const [editingUserDetailsFormData, setEditingUserDetailsFormData] = useState<Partial<UserProfile>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("users");
  const [userDisplayOption, setUserDisplayOption] = useState<'byCompanyName' | 'byRegistrationDate'>('byCompanyName');

  const dateLocale = locale === 'en' ? enUS : lt;
  
  const getSafeDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
      return dateValue;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const formatDateSafe = (dateValue: any, formatString: string = "yyyy-MM-dd HH:mm") => {
      const dateObj = getSafeDate(dateValue);
      if (!dateObj) return t('common.notSpecified');
      return formatDateFn(dateObj, formatString, { locale: dateLocale });
  }

  const getCategoryNameAdmin = useCallback((categoryId: string) => {
    const category = detailedReportCategories.find(c => c.id === categoryId);
    return category ? t(category.nameKey) : categoryId;
  }, [t]);

  const getNationalityLabel = useCallback((nationalityCode?: string) => {
    if (!nationalityCode) return t('common.notSpecified');
    const country = countries.find(c => c.value === nationalityCode);
    return country ? t('countries.' + country.value) : nationalityCode;
  }, [t]);

  const logAdminAction = useCallback(async (actionKey: string, details: Record<string, any> = {}) => {
    if (!adminUser) return;
    try {
      const newLogEntry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
        adminId: adminUser.id,
        adminName: adminUser.contactPerson || adminUser.email,
        actionKey,
        details,
      };
      await storage.addAuditLogEntry(newLogEntry);
      const updatedLogs = await storage.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch(error) {
        console.error("Failed to log admin action:", error);
    }
  },[adminUser]);

  useEffect(() => {
    if (!authLoading && (!adminUser || !adminUser.isAdmin)) {
      router.replace('/dashboard');
    }
    if (adminUser && adminUser.isAdmin) {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [users, reports, logs] = await Promise.all([
                    storage.getAllUsers(),
                    storage.getAllReports(),
                    storage.getAuditLogs()
                ]);
                setAllUsersState(users);
                setAllReports(reports.filter(r => !r.deletedAt));
                setAuditLogs(logs);
            } catch(error) {
                console.error("Failed to fetch admin data:", error);
                toast({ variant: "destructive", title: "Klaida", description: "Nepavyko gauti administracinės informacijos." });
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }
  }, [adminUser, authLoading, router, toast]);

  const categoryReportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    detailedReportCategories.forEach(cat => counts[cat.id] = 0);
    allReports.filter(r => !r.deletedAt).forEach(report => {
      if (counts[report.category] !== undefined) {
        counts[report.category]++;
      } else {
        counts['other_category'] = (counts['other_category'] || 0) + 1; 
      }
    });
    return counts;
  }, [allReports]);

  const chartData = useMemo(() => {
    return detailedReportCategories
      .map((category, index) => ({
        name: getCategoryNameAdmin(category.id).substring(0, 20) + (getCategoryNameAdmin(category.id).length > 20 ? '...' : ''), 
        value: categoryReportCounts[category.id] || 0,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
      .filter(item => item.value > 0); 
  }, [categoryReportCounts, getCategoryNameAdmin]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);

  const processedUsers = useMemo(() => {
    let users = [...allUsersState];
    if (userDisplayOption === 'byCompanyName') {
      users.sort((a, b) => (a.companyName || "").localeCompare(b.companyName || "", locale));
    } else if (userDisplayOption === 'byRegistrationDate') {
      users.sort((a, b) => {
        const dateA = getSafeDate(a.registeredAt)?.getTime() ?? 0;
        const dateB = getSafeDate(b.registeredAt)?.getTime() ?? 0;
        return dateB - dateA; 
      });
    }
    return users;
  }, [allUsersState, userDisplayOption, locale]);

  const totalUserPages = Math.ceil(processedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return processedUsers.slice(startIndex, endIndex);
  }, [processedUsers, currentPage]);


  const getStatusText = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active': return t('admin.users.status.active');
      case 'pending_verification': return t('admin.users.status.pending_verification');
      case 'pending_payment': return t('admin.users.status.pending_payment');
      case 'inactive': return t('admin.users.status.inactive');
      default: return status;
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: UserProfile['paymentStatus']) => {
    if(!adminUser) return;

    const targetUser = allUsersState.find(u => u.id === userId);
    if (!targetUser) return;

    const oldStatus = targetUser.paymentStatus;
    let newAccountActivatedAt = targetUser.accountActivatedAt;

    if (newStatus === 'active' && oldStatus !== 'active') {
      newAccountActivatedAt = new Date().toISOString();
    }
    
    const updatedUserData = { paymentStatus: newStatus, accountActivatedAt: newAccountActivatedAt };
    await storage.updateUserProfile(userId, updatedUserData);

    setAllUsersState(prevUsers => prevUsers.map(u =>
      u.id === userId ? { ...u, ...updatedUserData } : u
    ));

    await logAdminAction("auditLog.action.userStatusChanged", { 
      userId: targetUser.id, 
      userEmail: targetUser.email,
      companyName: targetUser.companyName,
      oldStatus: getStatusText(oldStatus), 
      newStatus: getStatusText(newStatus) 
    });

    await storage.addUserNotification(targetUser.id, {
      type: 'account_status_change',
      titleKey: 'notifications.accountStatusChanged.title',
      messageKey: 'notifications.accountStatusChanged.message',
      messageParams: {
        oldStatus: getStatusText(oldStatus),
        newStatus: getStatusText(newStatus),
        adminName: adminUser.contactPerson || adminUser.email || 'Administrator'
      },
      link: '/account?tab=details'
    });


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

  const handleSaveUserDetails = async () => {
    if (!selectedUserForDetails) return;

    const updatedUser: UserProfile = {
      ...selectedUserForDetails,
      companyName: editingUserDetailsFormData.companyName || selectedUserForDetails.companyName,
      companyCode: editingUserDetailsFormData.companyCode || selectedUserForDetails.companyCode,
      vatCode: editingUserDetailsFormData.vatCode || '',
      address: editingUserDetailsFormData.address || selectedUserForDetails.address,
      contactPerson: editingUserDetailsFormData.contactPerson || selectedUserForDetails.contactPerson,
      email: editingUserDetailsFormData.email || selectedUserForDetails.email,
      phone: editingUserDetailsFormData.phone || selectedUserForDetails.phone,
    };
    
    await storage.updateUserProfile(updatedUser.id, updatedUser);

    setAllUsersState(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUserForDetails(updatedUser);
    setIsEditingUserDetails(false);
    
    await logAdminAction("auditLog.action.userDetailsUpdated", {
      userId: updatedUser.id,
      userEmail: updatedUser.email,
      companyName: updatedUser.companyName,
      updatedFields: Object.keys(editingUserDetailsFormData).filter(key => editingUserDetailsFormData[key as keyof Partial<UserProfile>] !== selectedUserForDetails[key as keyof UserProfile] )
    });
    
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

  const handleDeleteReport = async (reportId: string, reportFullName: string) => {
    setDeletingReportId(reportId);
    await storage.softDeleteReport(reportId);
    setAllReports(prevReports => prevReports.filter(report => report.id !== reportId));

    await logAdminAction("auditLog.action.reportDeleted", { 
      reportId: reportId,
      driverFullName: reportFullName,
    });

    toast({
      title: t('admin.entries.toast.entryDeleted.title'),
      description: t('admin.entries.toast.entryDeleted.description'),
    });
    setDeletingReportId(null);
  };
  
  const handleDeleteAllReports = async () => {
    setIsDeletingAllReports(true);
    const deletedCount = await storage.softDeleteAllReports();
    setAllReports([]); // Clear from view

    await logAdminAction("auditLog.action.allReportsDeleted", { count: deletedCount });

    toast({
      title: t('admin.entries.toast.allEntriesDeleted.title'),
      description: t('admin.entries.toast.allEntriesDeleted.description', { count: deletedCount }),
    });
    setIsDeletingAllReports(false);
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
  
  let lastGroupHeader = '';

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
          {t('admin.pageTitle')}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="users" className="text-base py-2.5">
            <Users className="mr-2 h-5 w-5" /> {t('admin.tabs.userManagement')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">
            <FileText className="mr-2 h-5 w-5" /> {t('admin.tabs.entryManagement')}
          </TabsTrigger>
           <TabsTrigger value="audit" className="text-base py-2.5">
            <Activity className="mr-2 h-5 w-5" /> {t('admin.tabs.auditLog')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-base py-2.5">
            <BarChart3 className="mr-2 h-5 w-5" /> {t('admin.tabs.statistics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>{t('admin.users.title')} ({processedUsers.length})</CardTitle>
                  <CardDescription>
                    {t('admin.users.description')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="user-display-option" className="text-sm text-muted-foreground whitespace-nowrap">
                    <ListFilter className="inline h-4 w-4 mr-1.5 relative -top-px" />
                    {t('admin.users.displayOptions.title')}
                  </Label>
                  <Select value={userDisplayOption} onValueChange={(value: 'byCompanyName' | 'byRegistrationDate') => setUserDisplayOption(value)}>
                    <SelectTrigger id="user-display-option" className="w-auto sm:min-w-[250px]">
                      <SelectValue placeholder={t('admin.users.displayOptions.title')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="byCompanyName">{t('admin.users.displayOptions.byCompanyName')}</SelectItem>
                      <SelectItem value="byRegistrationDate">{t('admin.users.displayOptions.byRegistrationDate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.table.companyName')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('admin.users.table.contactPerson')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('admin.users.table.email')}</TableHead>
                      <TableHead className="hidden md:table-cell text-center">{t('admin.users.table.registrationDate')}</TableHead>
                      <TableHead className="text-center">{t('admin.users.table.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{paginatedUsers.map((u) => {
                      const currentMonthYearGroup = u.registeredAt ? formatDateSafe(u.registeredAt, t('admin.users.groupHeaderMonthFormat')) : t('common.notSpecified');
                      const showGroupHeader = userDisplayOption === 'byRegistrationDate' && currentMonthYearGroup !== lastGroupHeader;
                      if (showGroupHeader) {
                        lastGroupHeader = currentMonthYearGroup;
                      }
                      return (
                        <Fragment key={u.id}>
                          {showGroupHeader && (
                            <TableRow className="bg-muted/30 hover:bg-muted/40">
                              <TableCell colSpan={6} className="py-3 px-4 font-semibold text-md text-foreground">
                                {currentMonthYearGroup}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium">{u.companyName}</TableCell>
                            <TableCell className="hidden md:table-cell">{u.contactPerson}</TableCell>
                            <TableCell className="hidden lg:table-cell">{u.email}</TableCell>
                            <TableCell className="hidden md:table-cell text-center text-xs">
                              {u.registeredAt ? formatDateSafe(u.registeredAt, 'yyyy-MM-dd') : '-'}
                            </TableCell>
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
                        </Fragment>
                      );
                    })}</TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('admin.users.noUsersFound')}</p>
                </div>
              )}
            </CardContent>
             {totalUserPages > 1 && (
                <CardFooter className="border-t pt-4 justify-between">
                    <Button 
                        variant="outline" 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> {t('common.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {t('common.page')} {currentPage} {t('common.of')} {totalUserPages}
                    </span>
                    <Button 
                        variant="outline" 
                        onClick={() => setCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                        disabled={currentPage === totalUserPages}
                    >
                        {t('common.next')} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-xl">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>{t('admin.entries.title')} ({allReports.length})</CardTitle>
                        <CardDescription>
                            {t('admin.entries.description')}
                        </CardDescription>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeletingAllReports || allReports.length === 0}>
                                {isDeletingAllReports ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                                {t('admin.entries.actions.deleteAllEntries')}
                            </Button>
                        </AlertDialogTrigger>
                        {allReports.length > 0 && (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.entries.deleteAllDialog.title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('admin.entries.deleteAllDialog.description')}
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAllReports} className="bg-destructive hover:bg-destructive/90">
                                    {t('admin.entries.deleteAllDialog.confirmDeleteAll')}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                    </AlertDialog>
                </div>
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
                            {getCategoryNameAdmin(report.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{report.reporterCompanyName || t('common.notSpecified')}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-muted-foreground">
                          {formatDateSafe(report.createdAt)}
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
                                  <AlertDialogAction onClick={() => handleDeleteReport(report.id, report.fullName)} className="bg-destructive hover:bg-destructive/90">
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

        <TabsContent value="audit">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.auditLog.title')}</CardTitle>
              <CardDescription>
                {t('admin.auditLog.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">{t('admin.auditLog.table.timestamp')}</TableHead>
                      <TableHead className="w-[20%]">{t('admin.auditLog.table.admin')}</TableHead>
                      <TableHead className="w-[30%]">{t('admin.auditLog.table.action')}</TableHead>
                      <TableHead className="w-[30%]">{t('admin.auditLog.table.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateSafe(log.timestamp, "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-sm">{log.adminName}</TableCell>
                        <TableCell className="text-sm">{t(log.actionKey, log.details)}</TableCell>
                        <TableCell className="text-xs">
                          <pre className="whitespace-pre-wrap bg-muted/30 p-2 rounded-md max-h-24 overflow-y-auto">{JSON.stringify(log.details, null, 2)}</pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('admin.auditLog.noLogsFound')}</p>
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
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 60 }} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                            tickFormatter={(value) => value}
                        />
                        <YAxis />
                        <RechartsTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="value" radius={5} />
                        </BarChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('admin.statistics.noDataForChart')}</p>
                </div>
              )}
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
                  <p className="text-base text-foreground">{getNationalityLabel(selectedReportForDetails.nationality)}</p>
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
                  {getCategoryNameAdmin(selectedReportForDetails.category)}
                </Badge>
              </div>
              {selectedReportForDetails.tags && selectedReportForDetails.tags.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4" />{t('admin.entryDetailsModal.tags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReportForDetails.tags.map(tagKey => (
                      <Badge key={tagKey} variant="outline" className="text-sm">{t('tags.' + tagKey)}</Badge>
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
                <p className="text-base text-foreground">{formatDateSafe(selectedReportForDetails.createdAt, "yyyy-MM-dd HH:mm:ss")}</p>
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
                 <UserInfoField label={t('admin.users.table.registrationDate')} value={formatDateSafe(selectedUserForDetails.registeredAt, "yyyy-MM-dd HH:mm")} icon={CalendarDays} />
              </div>
              <div className="md:col-span-2">
                <UserInfoField label={t('admin.userDetailsModal.status')} value={getStatusText(selectedUserForDetails.paymentStatus)} icon={CheckCircle2} />
              </div>
              {selectedUserForDetails.accountActivatedAt && selectedUserForDetails.paymentStatus === 'active' && (
                <div className="md:col-span-2">
                  <UserInfoField
                    label={t('admin.userDetailsModal.accountActiveUntil')}
                    value={formatDateSafe(addYears(getSafeDate(selectedUserForDetails.accountActivatedAt)!, 1), "yyyy-MM-dd")}
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
