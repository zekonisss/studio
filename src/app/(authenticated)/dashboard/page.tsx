
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Search, FilePlus2, History, UserCircle, BarChart3, AlertTriangle, CheckCircle2, UserCog, Loader2, Layers } from "lucide-react";
import Image from "next/image";
import { format as formatDateFn, addYears, addMonths, isBefore } from 'date-fns';
import { lt } from 'date-fns/locale';
import type { Report } from '@/types';
import { getReportsFromLocalStoragePublic, MOCK_GENERAL_REPORTS, combineAndDeduplicateReports } from '@/types';


export default function DashboardPage() {
  const { user } = useAuth();
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  useEffect(() => {
    const fetchTotalReports = () => {
      const localReports = getReportsFromLocalStoragePublic();
      const combined = combineAndDeduplicateReports(localReports, MOCK_GENERAL_REPORTS);
      setTotalReportsCount(combined.length);
    };
    fetchTotalReports();
  }, []);


  const quickActions = [
    { label: "Atlikti Paiešką", href: "/search", icon: Search, description: "Greitai raskite vairuotojo informaciją." },
    { label: "Pridėti Įrašą", href: "/reports/add", icon: FilePlus2, description: "Registruokite naują įvykį ar pažeidimą." },
  ];

  const subscriptionEndDate = user?.accountActivatedAt ? addYears(new Date(user.accountActivatedAt), 1) : null;
  const showExpirationWarning = user?.paymentStatus === 'active' && subscriptionEndDate && isBefore(subscriptionEndDate, addMonths(new Date(), 1));

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-8 p-6 rounded-lg shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <h1 className="text-3xl font-bold">Sveiki, {user?.contactPerson || 'Vartotojau'}!</h1>
        <p className="text-lg mt-1">Jūsų įmonė: {user?.companyName}</p>
        <p className="mt-2 text-sm opacity-90">
          DriverShield padeda jums valdyti rizikas ir užtikrinti saugesnę veiklą.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Greitieji Veiksmai</h2>
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Card key={action.href} className="hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{action.label}</CardTitle>
                  <action.icon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[calc(1.25rem*3)]">{action.description}</p> {}
                  <div className="mt-auto">
                    <Button asChild className="w-full" variant="default">
                      <Link href={action.href}>Eiti</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-2 h-6 w-6 text-primary" />
              Sistemos Apžvalga
            </CardTitle>
            <CardDescription>Svarbiausi jūsų veiklos rodikliai ir informacija.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jūsų Pridėti Įrašai</p>
                <p className="text-2xl font-bold">N/A</p> {}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/history">Žiūrėti Visus</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atliktos Paieškos (šį mėn.)</p>
                <p className="text-2xl font-bold">N/A</p> {}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/search/history">Žiūrėti Istoriją</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div className="flex items-center">
                 <Layers className="mr-3 h-7 w-7 text-primary/80" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bendras Įrašų Kiekis Platformoje</p>
                  <p className="text-2xl font-bold">{totalReportsCount}</p>
                </div>
              </div>
            </div>
            {showExpirationWarning && subscriptionEndDate && (
                <div className="p-4 border border-dashed border-yellow-500 bg-yellow-50 rounded-md text-yellow-700">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                    <div>
                    <h4 className="font-semibold">Svarbus Pranešimas</h4>
                    <p className="text-sm">
                        Artėja metinio abonemento pabaiga ({formatDateFn(subscriptionEndDate, "yyyy-MM-dd", { locale: lt })}). 
                        Prašome nepamiršti jo pratęsti laiku.
                    </p>
                    </div>
                </div>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Naudingos Nuorodos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                <Image src="https://placehold.co/600x338.png" alt="Driver Safety" layout="fill" objectFit="cover" data-ai-hint="driving safety" />
              </div>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/terms">Naudojimosi Taisyklės</Link>
            </Button>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/privacy">Privatumo Politika</Link>
            </Button>
            <Button variant="link" asChild className="p-0 h-auto justify-start">
              <Link href="/support">Pagalba ir DUK</Link>
            </Button>
            <div className="mt-4 pt-4 border-t">
                {user && user.paymentStatus === 'active' && subscriptionEndDate ? (
                    <>
                        <p className="text-sm font-semibold flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-600"/>
                        Mokėjimo Statusas: <span className="ml-1 font-bold text-green-700">Aktyvus</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Jūsų metinė prenumerata galioja iki {formatDateFn(subscriptionEndDate, "yyyy-MM-dd", { locale: lt })}.
                        </p>
                    </>
                ) : user && user.paymentStatus === 'pending_payment' ? (
                    <p className="text-sm font-semibold flex items-center text-yellow-700">
                        <Loader2 className="h-5 w-5 mr-2 text-yellow-600 animate-spin"/>
                        Mokėjimo Statusas: <span className="ml-1 font-bold">Laukia apmokėjimo</span>
                    </p>
                ) : user && user.paymentStatus === 'pending_verification' ? (
                    <p className="text-sm font-semibold flex items-center text-orange-600">
                        <UserCog className="h-5 w-5 mr-2 text-orange-600"/>
                        Mokėjimo Statusas: <span className="ml-1 font-bold">Laukia patvirtinimo</span>
                    </p>
                ) : (
                    <p className="text-sm font-semibold flex items-center text-red-700">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600"/>
                        Mokėjimo Statusas: <span className="ml-1 font-bold">Neaktyvus</span>
                    </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

