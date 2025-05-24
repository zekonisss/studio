
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Users, FileText, AlertTriangle } from "lucide-react";
import type { UserProfile, Report } from "@/types";
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports } from "@/types";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

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

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.replace('/dashboard');
    }
    if (user && user.isAdmin) {
      const localReports = getReportsFromLocalStorage();
      const combined = combineAndDeduplicateReports(localReports, MOCK_GENERAL_REPORTS);
      setAllReports(combined);
      setIsLoadingData(false);
    }
  }, [user, authLoading, router]);

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
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users" className="text-base py-2.5">
            <Users className="mr-2 h-5 w-5" /> Vartotojų Valdymas
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-base py-2.5">
            <FileText className="mr-2 h-5 w-5" /> Pranešimų Valdymas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Registruoti Vartotojai ({MOCK_ALL_USERS.length})</CardTitle>
              <CardDescription>
                Platformoje registruotų įmonių (vartotojų) sąrašas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {MOCK_ALL_USERS.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Įmonės Pavadinimas</TableHead>
                      <TableHead>Kontaktinis Asmuo</TableHead>
                      <TableHead>El. Paštas</TableHead>
                      <TableHead className="text-center">Mokėjimo Būsena</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_ALL_USERS.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.companyName}</TableCell>
                        <TableCell>{u.contactPerson}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={u.paymentStatus === 'active' ? 'default' : (u.paymentStatus === 'pending_verification' ? 'secondary' : 'destructive')}>
                            {u.paymentStatus === 'active' ? 'Aktyvi' : (u.paymentStatus === 'pending_verification' ? 'Laukiama patvirtinimo' : 'Neaktyvi')}
                          </Badge>
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
                      <TableHead>Kategorija</TableHead>
                      <TableHead>Pateikė Įmonė</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.fullName}</TableCell>
                        <TableCell>
                           <Badge variant={report.category === 'kuro_vagyste' || report.category === 'zala_technikai' ? 'destructive' : 'secondary'}>
                             {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </Badge>
                        </TableCell>
                        <TableCell>{report.reporterCompanyName || "Nenurodyta"}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
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
      </Tabs>
    </div>
  );
}
