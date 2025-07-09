"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="mb-8 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
        <h1 className="text-4xl font-bold text-primary">DriverCheck</h1>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <MailCheck className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl">Patvirtinkite savo el. paštą</CardTitle>
          <CardDescription>
            Išsiuntėme patvirtinimo laišką jūsų nurodytu el. pašto adresu. Prašome patikrinti savo pašto dėžutę (taip pat ir brukalo katalogą) ir paspausti nuorodą laiške, kad aktyvuotumėte paskyrą.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Kadangi tai yra demonstracinė versija, el. laiškai nėra siunčiami. Jūsų registracija laukia administratoriaus patvirtinimo.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/auth/login">Grįžti į prisijungimą</Link>
          </Button>
        </CardFooter>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DriverCheck. Visos teisės saugomos.
      </p>
    </div>
  );
}
