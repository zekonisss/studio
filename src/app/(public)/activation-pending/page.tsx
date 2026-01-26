"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

export default function ActivationPendingPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) return;
    setIsPaymentLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nepavyko sukurti mokėjimo sesijos.');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Mokėjimo Klaida",
        description: error.message,
      });
      setIsPaymentLoading(false);
    }
  };

  const getStatusComponent = () => {
    switch (user?.paymentStatus) {
        case 'pending_verification':
            return (
                <>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Paskyra laukia patvirtinimo</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mt-2 max-w-sm mx-auto">
                        Jūsų registracija gauta. Mūsų komanda peržiūri informaciją ir patvirtins jūsų tapatybę per 1 d.d. Apie patvirtinimą būsite informuoti el. paštu.
                    </CardDescription>
                </>
            );
        case 'pending_payment':
            return (
                 <>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <CreditCard className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Paskyra patvirtinta!</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mt-2 max-w-sm mx-auto">
                        Norėdami aktyvuoti paskyrą ir pradėti naudotis visomis funkcijomis, apmokėkite metinę prenumeratą.
                    </CardDescription>
                     <Button onClick={handlePayment} disabled={isPaymentLoading} size="lg" className="mt-6 w-full max-w-xs mx-auto">
                        {isPaymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Apmokėti metinę prenumeratą
                    </Button>
                 </>
            );
        default:
            return (
                 <>
                    <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Paskyra neaktyvi</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mt-2 max-w-sm mx-auto">
                        Jūsų paskyra šiuo metu yra neaktyvi. Prašome apmokėti prenumeratą arba susisiekti su palaikymo komanda.
                    </CardDescription>
                     <Button onClick={handlePayment} disabled={isPaymentLoading} size="lg" className="mt-6 w-full max-w-xs mx-auto">
                        {isPaymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Apmokėti ir aktyvuoti
                    </Button>
                 </>
            );
    }
  }

  return (
    <Card className="w-full max-w-lg rounded-xl border p-6 sm:p-8 text-center shadow-glow-primary bg-card/80 dark:bg-card/40 backdrop-blur-sm">
      <CardHeader className="p-0">
         {getStatusComponent()}
      </CardHeader>
      <CardContent className="p-0">
           <div className="flex flex-col items-center gap-4 mt-8 border-t pt-6">
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Jei norite prisijungti su kita paskyra (pvz., administratoriaus) – atsijunkite.
              </p>
              <Button variant="outline" onClick={logout}>
                  Atsijungti ir grįžti į prisijungimą
              </Button>
          </div>
      </CardContent>
    </Card>
  );
}
