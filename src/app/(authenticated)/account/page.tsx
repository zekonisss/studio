
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
import { lt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAllUsers, saveAllUsers } from "@/types";


// Mock data (same as used in respective history pages, filtered for this user)
const mockUserReports: Report[] = [
  { id: "report-user-1", reporterId: "dev-user-123", reporterCompanyName: 'UAB "Bandomoji Įmonė"', fullName: "Antanas Antanaitis", birthYear: 1992, category: "netinkamas_elgesys", tags: ["konfliktiskas"], comment: "Vairuotojas buvo nemandagus su klientu.", createdAt: new Date("2024-02-20T09:15:00Z") },
  { id: "report-user-2", reporterId: "dev-user-123", reporterCompanyName: 'UAB "Bandomoji Įmonė"', fullName: "Zita Zitaite", category: "greicio_virijimas", tags: ["pasikartojantis"], comment: "GPS rodo greičio viršijimą.", createdAt: new Date("2024-01-10T16:45:00Z") },
];
const mockSearchLogs: SearchLog[] = [
  { id: "log1", userId: "dev-user-123", searchText: "Jonas Jonaitis", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "log3", userId: "dev-user-123", searchText: "Petras Petraitis", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
];

export default function AccountPage() {
  const { user, loading: authLoading, updateUserInContext } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (tab) {
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
    console.log("Saving data:", formData);
    await new Promise(resolve => setTimeout(resolve, 1000));

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

  const InfoField = ({ label, value, icon: Icon, name, isEditing, onChange }: { label: string, value: string, icon: React.ElementType, name?: string, isEditing?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium text-muted-foreground flex items-center">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Label>
      {isEditing && name ? (
        <Input id={name} name={name} value={value} onChange={onChange} className="text-base" />
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
          Mano Paskyra
        </h1>
        {activeTab === "details" && (
          <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} variant={isEditing ? "default" : "outline"}>
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
            {isEditing ? "Išsaugoti Pakeitimus" : "Redaguoti Duomenis"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="details" className="text-base py-2.5">Įmonės Duomenys</TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">Mano Pranešimai</TabsTrigger>
          <TabsTrigger value="searches" className="text-base py-2.5">Paieškų Istorija</TabsTrigger>
          <TabsTrigger value="payment" className="text-base py-2.5">Mokėjimai</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Registracijos Informacija</CardTitle>
              <CardDescription>Čia galite peržiūrėti ir redaguoti savo įmonės registracijos duomenis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Įmonės Pavadinimas" value={isEditing ? formData.companyName : user.companyName} icon={Building2} name="companyName" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="Įmonės Kodas" value={isEditing ? formData.companyCode : user.companyCode} icon={Briefcase} name="companyCode" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="PVM Kodas" value={isEditing ? formData.vatCode : (user.vatCode || '')} icon={Percent} name="vatCode" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="Adresas" value={isEditing ? formData.address : user.address} icon={MapPin} name="address" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="Kontaktinis Asmuo" value={isEditing ? formData.contactPerson : user.contactPerson} icon={UserIcon} name="contactPerson" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="El. Paštas" value={isEditing ? formData.email : user.email} icon={Mail} name="email" isEditing={isEditing} onChange={handleInputChange} />
                <InfoField label="Telefonas" value={isEditing ? formData.phone : user.phone} icon={Phone} name="phone" isEditing={isEditing} onChange={handleInputChange} />
              </div>
            </CardContent>
             <CardFooter className="border-t pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-green-600"/>
                    <span>Jūsų duomenys yra saugomi ir naudojami pagal privatumo politiką.</span>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>Jūsų Pateikti Pranešimai</CardTitle>
              <CardDescription>Trumpas jūsų pateiktų pranešimų sąrašas. Išsamią istoriją rasite <Link href="/reports/history" className="text-primary hover:underline">čia</Link>.</CardDescription>
            </CardHeader>
            <CardContent>
              {mockUserReports.length > 0 ? (
                <ul className="space-y-4">
                  {mockUserReports.slice(0, 3).map(report => (
                    <li key={report.id} className="p-4 border rounded-md hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground">{report.fullName}</h4>
                        <Badge variant="secondary">{report.category.replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{report.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">Pateikta: {formatDateFn(report.createdAt, "yyyy-MM-dd HH:mm", { locale: lt })}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">Pranešimų nerasta.</p>}
               {mockUserReports.length > 3 && (
                 <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                        <Link href="/reports/history">Žiūrėti Visus Pranešimus</Link>
                    </Button>
                 </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="searches">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Jūsų Paieškų Istorija</CardTitle>
              <CardDescription>Keletas jūsų naujausių paieškų. Išsamią istoriją rasite <Link href="/search/history" className="text-primary hover:underline">čia</Link>.</CardDescription>
            </CardHeader>
            <CardContent>
              {mockSearchLogs.length > 0 ? (
                <ul className="space-y-3">
                  {mockSearchLogs.slice(0, 5).map(log => (
                    <li key={log.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/30 transition-colors">
                      <span className="font-medium text-foreground">{log.searchText}</span>
                      <div className="flex items-center gap-x-4">
                        <Badge variant={log.resultsCount > 0 ? "default" : "outline"}>{log.resultsCount} {log.resultsCount === 1 ? "rez." : "rez."}</Badge>
                        <span className="text-sm text-muted-foreground">{formatDateFn(log.timestamp, "yyyy-MM-dd HH:mm", { locale: lt })}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">Paieškų istorijos nėra.</p>}
               {mockSearchLogs.length > 5 && (
                 <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                        <Link href="/search/history">Žiūrėti Visą Paieškų Istoriją</Link>
                    </Button>
                 </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Mokėjimai ir Prenumerata</CardTitle>
                    <CardDescription>Tvarkykite savo prenumeratą ir peržiūrėkite mokėjimų istoriją.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {user.paymentStatus === 'active' && user.accountActivatedAt ? (
                        <div className="p-6 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center">
                                <ShieldCheck className="h-8 w-8 text-green-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-green-800">Aktyvi Prenumerata</h4>
                                    <p className="text-sm text-green-700">Jūsų DriverShield metinė prenumerata yra aktyvi.</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-green-600">
                                Galioja iki: <span className="font-medium">{formatDateFn(addYears(new Date(user.accountActivatedAt), 1), "yyyy 'm.' MMMM dd 'd.'", { locale: lt })}</span>
                            </p>
                            <p className="text-sm text-green-600">Kaina: <span className="font-medium">29.99 €/mėn (Metinė kaina: 346.00 € be PVM)</span></p>
                        </div>
                    ) : user.paymentStatus === 'pending_payment' ? (
                         <div className="p-6 border rounded-lg bg-yellow-50 border-yellow-200">
                            <div className="flex items-center">
                                <Loader2 className="h-8 w-8 text-yellow-600 mr-4 animate-spin"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-yellow-800">Laukiama Apmokėjimo</h4>
                                    <p className="text-sm text-yellow-700">Jūsų paskyros aktyvavimas laukia mokėjimo patvirtinimo.</p>
                                </div>
                            </div>
                        </div>
                    ) : user.paymentStatus === 'pending_verification' ? (
                         <div className="p-6 border rounded-lg bg-orange-50 border-orange-200">
                            <div className="flex items-center">
                                <UserCog className="h-8 w-8 text-orange-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-800">Laukiama Patvirtinimo</h4>
                                    <p className="text-sm text-orange-700">Jūsų paskyros registracija laukia administratoriaus patvirtinimo.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="p-6 border rounded-lg bg-red-50 border-red-200">
                            <div className="flex items-center">
                                <AlertTriangle className="h-8 w-8 text-red-600 mr-4"/>
                                <div>
                                    <h4 className="text-lg font-semibold text-red-800">Paskyra Neaktyvi</h4>
                                    <p className="text-sm text-red-700">Jūsų DriverShield prenumerata nėra aktyvi.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold mb-2 text-foreground">Mokėjimo Istorija</h4>
                        <p className="text-sm text-muted-foreground">Šiuo metu mokėjimų istorijos rodymas nėra įgyvendintas. Ateityje čia matysite savo sąskaitas.</p>
                    </div>

                    <Button disabled>
                       Tvarkyti Prenumeratą (Stripe)
                    </Button>
                    <p className="text-xs text-muted-foreground">Prenumeratos tvarkymas bus atliekamas per Stripe platformą (integracija bus pridėta vėliau).</p>
                </CardContent>
                 <CardFooter className="border-t pt-6">
                    <p className="text-sm text-muted-foreground">Jei turite klausimų dėl mokėjimų, susisiekite su mumis.</p>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
