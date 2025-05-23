
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Search, FilePlus2, History, UserCircle, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

// export const metadata: Metadata = { // Cannot be used in client component
//   title: 'Valdymo Skydas - DriverShield',
// };

export default function DashboardPage() {
  const { user } = useAuth();

  const quickActions = [
    { label: "Atlikti Paiešką", href: "/search", icon: Search, description: "Greitai raskite vairuotojo informaciją." },
    { label: "Pridėti Pranešimą", href: "/reports/add", icon: FilePlus2, description: "Registruokite naują įvykį ar pažeidimą." },
    { label: "Mano Paskyra", href: "/account", icon: UserCircle, description: "Peržiūrėkite ir tvarkykite paskyros duomenis." },
    { label: "Pranešimų Istorija", href: "/reports/history", icon: History, description: "Matykite visus savo pridėtus pranešimus." },
  ];

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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{action.label}</CardTitle>
                <action.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-16">{action.description}</p>
                <div className="mt-auto">
                  <Button asChild className="w-full" variant="default">
                    <Link href={action.href}>Eiti</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                <p className="text-sm font-medium text-muted-foreground">Jūsų Pridėti Pranešimai</p>
                <p className="text-2xl font-bold">12</p> {/* Placeholder */}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/history">Žiūrėti Visus</Link>
              </Button>
            </div>
             <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atliktos Paieškos (šį mėn.)</p>
                <p className="text-2xl font-bold">47</p> {/* Placeholder */}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/search/history">Žiūrėti Istoriją</Link>
              </Button>
            </div>
            <div className="p-4 border border-dashed border-yellow-500 bg-yellow-50 rounded-md text-yellow-700">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h4 className="font-semibold">Svarbus Pranešimas</h4>
                  <p className="text-sm">Artėja metinio abonemento pabaiga. Prašome nepamiršti jo pratęsti laiku.</p>
                </div>
              </div>
            </div>
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
                <p className="text-sm font-semibold flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600"/>
                  Mokėjimo Statusas: <span className="ml-1 font-bold text-green-700">Aktyvus</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Jūsų metinė prenumerata galioja iki 2025-03-15.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
