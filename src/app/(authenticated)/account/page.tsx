
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, UserCircle, Building2, Briefcase, MapPin, User as UserIcon, Mail, Phone, History, ListChecks, Edit3, Save, CreditCard, ShieldCheck, CalendarDays, Percent, AlertTriangle, UserCog } from "lucide-react";
import type { Report, SearchLog, UserProfile } from "@/types";
import { format as formatDateFn, addYears } from "date-fns";
import { lt, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAllUsers, saveAllUsers, detailedReportCategories, getCategoryNameAdmin as getCategoryNameForDisplay } from "@/types"; // Renamed import for clarity
import { useLanguage } from '@/contexts/language-context';


// Mock data (same as used in respective history pages, filtered for this user)
const mockUserReports: Report[] = [
  { id: "report-user-1", reporterId: "dev-user-123", reporterCompanyName: 'UAB "DriverCheck Demo"', fullName: "Antanas Antanaitis", birthYear: 1992, category: "toksiskas_elgesys", tags: ["Konfliktiškas asmuo", "Kita"], comment: "Vairuotojas buvo nemandagus su klientu.", createdAt: new Date("2024-02-20T09:15:00Z") },
  { id: "report-user-2", reporterId: "dev-user-123", reporterCompanyName: 'UAB "DriverCheck Demo"', fullName: "Zita Zitaite", category: "neatsakingas_vairavimas", tags: ["Avaringumas", "Kita"], comment: "GPS rodo greičio viršijimą.", createdAt: new Date("2024-01-10T16:45:00Z") },
];
const mockSearchLogs: SearchLog[] = [
  { id: "log1", userId: "dev-user-123", searchText: "Jonas Jonaitis", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "log3", userId: "dev-user-123", searchText: "Petras Petraitis", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
];

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
  
  const dateLocale = locale === 'en' ? enUS : lt;

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
    }
    const tab = searchParams.get('tab');
    if (tab && ["details", "reports", "searches", "payment"].includes(tab)) {
        setActiveTab(tab);
    }
  }, [user, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsEditing(false);
    // console.log("Saving data:", formData); // For debugging
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save

    const allUsers = getAllUsers();
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
    saveAllUsers(updatedUsersList);
    updateUserInContext(updatedUser as UserProfile);
    // Add toast for success if needed
  };

  const onTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/account?tab=${value}`, { scroll: false });
  }

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="details" className="text-base py-2.5">{t('account.tabs.details')}</TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">{t('account.tabs.myEntries')}</TabsTrigger>
          <TabsTrigger value="searches" className="text-base py-2.5">{t('account.tabs.searchHistory')}</TabsTrigger>
          <TabsTrigger value="payment" className="text-base py-2.5">{t('account.tabs.payments')}</TabsTrigger>
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

        <TabsContent value="reports">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>{t('account.entries.title')}</CardTitle>
              <CardDescription>{t('account.entries.description.part1')} <Link href="/reports/history" className="text-primary hover:underline">{t('account.entries.description.link')}</Link>{t('account.entries.description.part2')}</CardDescription>
            </CardHeader>
            <CardContent>
              {mockUserReports.length > 0 ? (
                <ul className="space-y-4">
                  {mockUserReports.slice(0, 3).map(report => (
                    <li key={report.id} className="p-4 border rounded-md hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground">{report.fullName}</h4>
                        <Badge variant="secondary">{getCategoryNameForDisplay(report.category)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{report.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">{t('account.entries.submittedOn')}: {formatDateFn(report.createdAt, "yyyy-MM-dd HH:mm", { locale: dateLocale })}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">{t('account.entries.noEntries')}</p>}
               {mockUserReports.length > 3 && (
                 <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                        <Link href="/reports/history">{t('account.entries.viewAllButton')}</Link>
                    </Button>
                 </div>
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
              {mockSearchLogs.length > 0 ? (
                <ul className="space-y-3">
                  {mockSearchLogs.slice(0, 5).map(log => (
                    <li key={log.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/30 transition-colors">
                      <span className="font-medium text-foreground">{log.searchText}</span>
                      <div className="flex items-center gap-x-4">
                        <Badge variant={log.resultsCount > 0 ? "default" : "outline"}>{log.resultsCount} {t('account.searchHistory.resultsSuffix')}</Badge>
                        <span className="text-sm text-muted-foreground">{formatDateFn(log.timestamp, "yyyy-MM-dd HH:mm", { locale: dateLocale })}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">{t('account.searchHistory.noHistory')}</p>}
               {mockSearchLogs.length > 5 && (
                 <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                        <Link href="/search/history">{t('account.searchHistory.viewAllButton')}</Link>
                    </Button>
                 </div>
                )}
            </CardContent>
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
                        <div className="p-6 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center">
                                <ShieldCheck className="h-8 w-8 text-green-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-green-800">{t('account.payments.status.active.title')}</h4>
                                    <p className="text-sm text-green-700">{t('account.payments.status.active.description')}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-green-600">
                                {t('account.payments.status.active.validUntil')}: <span className="font-medium">{formatDateFn(addYears(new Date(user.accountActivatedAt), 1), "yyyy 'm.' MMMM dd 'd.'", { locale: dateLocale })}</span>
                            </p>
                             <p className="text-sm text-green-600">{t('account.payments.status.active.price')}: <span className="font-medium">29.99 € ({t('account.payments.status.active.annualPrice')} 346.00 € {t('account.payments.status.active.vatExcluded')})</span></p>
                        </div>
                    ) : user.paymentStatus === 'pending_payment' ? (
                         <div className="p-6 border rounded-lg bg-yellow-50 border-yellow-200">
                            <div className="flex items-center">
                                <Loader2 className="h-8 w-8 text-yellow-600 mr-4 animate-spin"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-yellow-800">{t('account.payments.status.pending_payment.title')}</h4>
                                    <p className="text-sm text-yellow-700">{t('account.payments.status.pending_payment.description')}</p>
                                </div>
                            </div>
                        </div>
                    ) : user.paymentStatus === 'pending_verification' ? (
                         <div className="p-6 border rounded-lg bg-orange-50 border-orange-200">
                            <div className="flex items-center">
                                <UserCog className="h-8 w-8 text-orange-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-800">{t('account.payments.status.pending_verification.title')}</h4>
                                    <p className="text-sm text-orange-700">{t('account.payments.status.pending_verification.description')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="p-6 border rounded-lg bg-red-50 border-red-200">
                            <div className="flex items-center">
                                <AlertTriangle className="h-8 w-8 text-red-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-red-800">{t('account.payments.status.inactive.title')}</h4>
                                    <p className="text-sm text-red-700">{t('account.payments.status.inactive.description')}</p>
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

      </Tabs>
    </div>
  );
}
