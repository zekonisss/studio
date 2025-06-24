
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, UserCircle, Building2, Briefcase, MapPin, User as UserIcon, Mail, Phone, History, ListChecks, Edit3, Save, CreditCard, ShieldCheck, CalendarDays, Percent, AlertTriangle, UserCog, Bell, Check, BellOff, Archive } from "lucide-react";
import type { Report, SearchLog, UserProfile, UserNotification } from "@/types";
import { format as formatDateFn, addYears } from "date-fns";
import { lt, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import * as types from "@/types"; 
import { useLanguage } from '@/contexts/language-context';


export default function AccountPage() {
  const { user, loading: authLoading, updateUserInContext } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyCode: "",
    vatCode: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
  });
  const [activeTab, setActiveTab] = useState("details");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  const [userReports, setUserReports] = useState<Report[]>([]);
  const [deletedUserReports, setDeletedUserReports] = useState<Report[]>([]);
  
  const dateLocale = locale === 'en' ? enUS : lt;

  const fetchUserReports = useCallback(() => {
    if (user) {
      const allReports = types.getReportsFromLocalStoragePublic();
      const allUserReports = allReports.filter(r => r.reporterId === user.id);
      
      const active = allUserReports.filter(r => !r.deletedAt).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const deleted = allUserReports.filter(r => !!r.deletedAt).sort((a,b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
      
      setUserReports(active);
      setDeletedUserReports(deleted);
    }
  }, [user]);

  const fetchNotifications = useCallback(() => {
    if (user) {
      setNotifications(types.getUserNotifications(user.id)); 
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName,
        companyCode: user.companyCode,
        vatCode: user.vatCode || "",
        address: user.address,
        contactPerson: user.contactPerson,
        email: user.email,
        phone: user.phone,
      });
      fetchNotifications();
      fetchUserReports();
    }
    const tab = searchParams.get('tab');
    if (tab && ["details", "reports", "deleted-reports", "searches", "payment", "notifications"].includes(tab)) {
        setActiveTab(tab);
    }
  }, [user, searchParams, fetchNotifications, fetchUserReports]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsEditing(false);
    const allUsers = types.getAllUsers(); 
    const updatedUser = {
        ...user,
        companyName: formData.companyName,
        companyCode: formData.companyCode,
        vatCode: formData.vatCode || undefined,
        address: formData.address,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
    };
    const updatedUsersList = allUsers.map(u => u.id === user.id ? updatedUser : u);
    types.saveAllUsers(updatedUsersList); 
    updateUserInContext(updatedUser as UserProfile);
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (user) {
      types.markNotificationAsRead(user.id, notificationId); 
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = () => {
    if (user) {
      types.markAllNotificationsAsRead(user.id); 
      fetchNotifications();
    }
  };

  const onTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/account?tab=${value}`, { scroll: false });
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const InfoField = ({ label, value, icon: Icon, name, isEditing, onChange }: { label: string, value: string | undefined, icon: React.ElementType, name?: string, isEditing?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium text-muted-foreground flex items-center">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Label>
      {isEditing && name ? (
        <Input id={name} name={name} value={value || ""} onChange={onChange} className="text-base" />
      ) : (
        <p className="text-base text-foreground bg-secondary/30 p-2.5 rounded-md min-h-[40px] flex items-center">{value || "-"}</p>
      )}
    </div>
  );

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <UserCircle className="mr-3 h-8 w-8 text-primary" />
          {t('account.pageTitle')}
        </h1>
        {activeTab === "details" && (
          <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} variant={isEditing ? "default" : "outline"}>
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
            {isEditing ? t('account.saveChangesButton') : t('account.editDataButton')}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="details" className="text-base py-2.5">{t('account.tabs.details')}</TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">{t('account.tabs.myEntries')}</TabsTrigger>
          <TabsTrigger value="deleted-reports" className="text-base py-2.5 flex items-center"><Archive className="mr-2 h-4 w-4" />{t('account.tabs.deletedEntries')}</TabsTrigger>
          <TabsTrigger value="searches" className="text-base py-2.5">{t('account.tabs.searchHistory')}</TabsTrigger>
          <TabsTrigger value="payment" className="text-base py-2.5">{t('account.tabs.payments')}</TabsTrigger>
          <TabsTrigger value="notifications" className="text-base py-2.5 flex items-center">
            {t('account.tabs.notifications')}
            {unreadNotificationsCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                {unreadNotificationsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">{t('account.details.title')}</CardTitle>
              <CardDescription>{t('account.details.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label={t('account.details.companyName')} value={isEditing ? formData.companyName : user.companyName} icon={Building2} name="companyName" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.companyCode')} value={isEditing ? formData.companyCode : user.companyCode} icon={Briefcase} name="companyCode" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.vatCode')} value={isEditing ? formData.vatCode : (user.vatCode || '')} icon={Percent} name="vatCode" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.address')} value={isEditing ? formData.address : user.address} icon={MapPin} name="address" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.contactPerson')} value={isEditing ? formData.contactPerson : user.contactPerson} icon={UserIcon} name="contactPerson" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.email')} value={isEditing ? formData.email : user.email} icon={Mail} name="email" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label={t('account.details.phone')} value={isEditing ? formData.phone : user.phone} icon={Phone} name="phone" isEditing={isEditing} onChange={handleInputChange} />
              </div>
            </CardContent>
             <CardFooter className="border-t pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-green-600"/>
                    <span>{t('account.details.footerNote')}</span>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>{t('account.entries.title')}</CardTitle>
              <CardDescription>{t('account.entries.description.part1')} <Link href="/reports/history" className="text-primary hover:underline">{t('account.entries.description.link')}</Link>{t('account.entries.description.part2')}</CardDescription>
            </CardHeader>
            <CardContent>
              {userReports.length > 0 ? (
                <ul className="space-y-4">
                  {userReports.slice(0, 3).map(report => (
                    <li key={report.id} className="p-4 border rounded-md hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground">{report.fullName}</h4>
                        <Badge variant="secondary">{types.getCategoryNameForDisplay(report.category, t)}</Badge> 
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{report.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">{t('account.entries.submittedOn')}: {formatDateFn(report.createdAt, "yyyy-MM-dd HH:mm", { locale: dateLocale })}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">{t('account.entries.noEntries')}</p>}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
                {userReports.length > 3 && (
                    <Button variant="outline" asChild>
                        <Link href="/reports/history">{t('account.entries.viewAllButton')}</Link>
                    </Button>
                )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="deleted-reports" className="space-y-6">
           <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Archive className="mr-2 h-5 w-5 text-primary"/>{t('account.entries.deletedTitle')}</CardTitle>
              <CardDescription>{t('account.entries.deletedDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {deletedUserReports.length > 0 ? (
                <ul className="space-y-4">
                  {deletedUserReports.map(report => (
                    <li key={report.id} className="p-4 border rounded-md hover:bg-muted/30 transition-colors opacity-70">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{report.fullName}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{t('account.entries.deletedOn')}: {formatDateFn(new Date(report.deletedAt!), "yyyy-MM-dd HH:mm", { locale: dateLocale })}</p>
                        </div>
                        <Badge variant="destructive">{types.getCategoryNameForDisplay(report.category, t)}</Badge> 
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{t('account.entries.noDeletedEntries')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="searches">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>{t('account.searchHistory.title')}</CardTitle>
              <CardDescription>{t('account.searchHistory.description.part1')} <Link href="/search/history" className="text-primary hover:underline">{t('account.searchHistory.description.link')}</Link>{t('account.searchHistory.description.part2')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* This part uses mock data, should be replaced with real data fetching in the future if needed */}
              <p className="text-muted-foreground">{t('account.searchHistory.noHistory')}</p>
            </CardContent>
             <CardFooter className="border-t pt-6 flex justify-end">
                <Button variant="outline" asChild>
                    <Link href="/search/history">{t('account.searchHistory.viewAllButton')}</Link>
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>{t('account.payments.title')}</CardTitle>
                    <CardDescription>{t('account.payments.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {user.paymentStatus === 'active' && user.accountActivatedAt ? (
                        <div className="p-6 border rounded-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700">
                            <div className="flex items-center">
                                <ShieldCheck className="h-8 w-8 text-green-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">{t('account.payments.status.active.title')}</h4>
                                    <p className="text-sm text-green-700 dark:text-green-400">{t('account.payments.status.active.description')}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                                {t('account.payments.status.active.validUntil')}: <span className="font-medium">{formatDateFn(addYears(new Date(user.accountActivatedAt), 1), "yyyy 'm.' MMMM dd 'd.'", { locale: dateLocale })}</span>
                            </p>
                             <p className="text-sm text-green-600 dark:text-green-400">{t('account.payments.status.active.price')}: <span className="font-medium">29.99 € ({t('account.payments.status.active.annualPrice')} 346.00 € {t('account.payments.status.active.vatExcluded')})</span></p>
                        </div>
                    ) : user.paymentStatus === 'pending_payment' ? (
                         <div className="p-6 border rounded-lg bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
                            <div className="flex items-center">
                                <Loader2 className="h-8 w-8 text-yellow-600 mr-4 animate-spin"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">{t('account.payments.status.pending_payment.title')}</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">{t('account.payments.status.pending_payment.description')}</p>
                                </div>
                            </div>
                        </div>
                    ) : user.paymentStatus === 'pending_verification' ? (
                         <div className="p-6 border rounded-lg bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700">
                            <div className="flex items-center">
                                <UserCog className="h-8 w-8 text-orange-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300">{t('account.payments.status.pending_verification.title')}</h4>
                                    <p className="text-sm text-orange-700 dark:text-orange-400">{t('account.payments.status.pending_verification.description')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="p-6 border rounded-lg bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700">
                            <div className="flex items-center">
                                <AlertTriangle className="h-8 w-8 text-red-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">{t('account.payments.status.inactive.title')}</h4>
                                    <p className="text-sm text-red-700 dark:text-red-400">{t('account.payments.status.inactive.description')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold mb-2 text-foreground">{t('account.payments.paymentHistoryTitle')}</h4>
                        <p className="text-sm text-muted-foreground">{t('account.payments.paymentHistoryDescription')}</p>
                    </div>

                    <Button disabled>
                       {t('account.payments.manageSubscriptionButton')}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t('account.payments.manageSubscriptionNote')}</p>
                </CardContent>
                 <CardFooter className="border-t pt-6">
                    <p className="text-sm text-muted-foreground">{t('account.payments.footerNote')}</p>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary"/>
                {t('account.notifications.title')}
              </CardTitle>
              <CardDescription>{t('account.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 && unreadNotificationsCount > 0 && (
                <div className="mb-4 text-right">
                  <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                    <Check className="mr-2 h-4 w-4" />
                    {t('account.notifications.markAllAsRead')}
                  </Button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>{t('account.notifications.noNotifications')}</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {notifications.map(notif => (
                    <li 
                      key={notif.id} 
                      className={`p-4 border rounded-md transition-colors ${notif.read ? 'bg-muted/30 opacity-70' : 'bg-card hover:bg-muted/20'}`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold ${!notif.read ? 'text-primary' : 'text-foreground'}`}>
                          {t(notif.titleKey)}
                        </h4>
                        {!notif.read && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} title={t('account.notifications.markAsRead')}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(notif.messageKey, notif.messageParams)}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDateFn(new Date(notif.createdAt), "yyyy-MM-dd HH:mm", { locale: dateLocale })}
                        </p>
                        {notif.link && (
                          <Button variant="link" size="sm" asChild className="p-0 h-auto">
                            <Link href={notif.link}>{t('account.notifications.viewDetails')}</Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
    

    

    



    
