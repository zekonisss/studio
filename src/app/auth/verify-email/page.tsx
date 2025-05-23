"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from 'next';

// Cannot define metadata in client component directly, needs to be exported from server component or layout
// export const metadata: Metadata = {
// title: 'Patvirtinkite El. Paštą - DriverShield',
// description: 'Patikrinkite savo el. pašto dėžutę ir patvirtinkite registraciją.',
// };


export default function VerifyEmailPage() {
  const { sendVerificationEmail, loading } = useAuth();

  const handleResendEmail = async () => {
    try {
      await sendVerificationEmail();
      // Add toast notification if needed
    } catch (error) {
      // Add error toast
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
       <div className="mb-8 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        <h1 className="text-4xl font-bold text-primary">DriverShield</h1>
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
            Negavote laiško?
          </p>
          <Button variant="link" onClick={handleResendEmail} disabled={loading} className="mt-2">
            {loading ? "Siunčiama..." : "Siųsti laišką pakartotinai"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/auth/login">Grįžti į prisijungimą</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
