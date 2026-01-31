"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivationPendingPage() {
  const { logout } = useAuth();

  return (
    <>
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-2">
                 <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Registracija priimta! Vyksta paskyros patvirtinimas.</CardTitle>
          <CardDescription>Ačiū, kad prisijungėte prie DriverCheck. Siekdami užtikrinti aukščiausią duomenų saugumą, kiekvieną naują įmonę patikriname rankiniu būdu. Tai paprastai trunka iki 24 val. Apie aktyvavimą informuosime el. paštu.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Jei turite klausimų, susisiekite su mumis el. paštu: <a href="mailto:support@drivercheck.lt" className="underline text-primary">support@drivercheck.lt</a></p>
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-6 border-t">
          <p className="text-xs text-muted-foreground">Norite prisijungti su kita paskyra?</p>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Atsijungti
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
