
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Hourglass, MailCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PendingApprovalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="mb-8 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        <h1 className="text-4xl font-bold text-primary">DriverShield</h1>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Hourglass className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl">Registracija Gauta</CardTitle>
          <CardDescription className="pt-2">
            Dėkojame už registraciją! Jūsų paskyra buvo sėkmingai sukurta ir dabar laukia administratoriaus patvirtinimo.
            <br /><br />
            Kai administratorius peržiūrės ir patvirtins jūsų duomenis, gausite pranešimą (šioje demonstracinėje versijoje pranešimas nebus siunčiamas, o paskyra bus aktyvuota administratoriaus).
            Prašome šiek tiek palaukti.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Paskyra bus aktyvuota per 1-2 darbo dienas (demonstracinėje versijoje - kai administratorius paspaus "patvirtinti").
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/auth/login">Grįžti į Prisijungimą</Link>
          </Button>
        </CardFooter>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DriverShield. Visos teisės saugomos.
      </p>
    </div>
  );
}
