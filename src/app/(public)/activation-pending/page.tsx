"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ActivationPendingPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
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

  const getStatusMessage = () => {
    switch (user?.paymentStatus) {
        case 'pending_verification':
            return (
                <>
                    <CardTitle className="mb-4 text-3xl font-bold">Paskyra sukurta, laukiama patvirtinimo</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mb-6">
                        Jūsų paskyra sėkmingai užregistruota. Mūsų komanda peržiūri informaciją. Kai tik Jūsų tapatybė bus patvirtinta, galėsite atlikti mokėjimą ir aktyvuoti paskyrą. Apie patvirtinimą būsite informuoti el. paštu.
                    </CardDescription>
                </>
            );
        case 'pending_payment':
            return (
                 <>
                    <CardTitle className="mb-4 text-3xl font-bold">Paskyra patvirtinta, laukiama apmokėjimo</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mb-6">
                        Jūsų tapatybė patvirtinta! Norėdami aktyvuoti paskyrą ir pradėti naudotis visomis funkcijomis, prašome atlikti metinės prenumeratos mokėjimą.
                    </CardDescription>
                    <Button onClick={handlePayment} disabled={isPaymentLoading} size="lg" className="w-full max-w-xs mx-auto">
                        {isPaymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Apmokėti metinę prenumeratą
                    </Button>
                 </>
            );
        default:
            return (
                 <>
                    <CardTitle className="mb-4 text-3xl font-bold">Paskyra neaktyvi</CardTitle>
                    <CardDescription className="text-muted-foreground text-center mb-6">
                        Jūsų paskyra šiuo metu yra neaktyvi. Prašome susisiekti su palaikymo komanda arba atlikti mokėjimą.
                    </CardDescription>
                     <Button onClick={handlePayment} disabled={isPaymentLoading} size="lg" className="w-full max-w-xs mx-auto">
                        {isPaymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Apmokėti ir aktyvuoti
                    </Button>
                 </>
            );
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="max-w-xl rounded-xl border p-8 text-center shadow-glow-primary">
        <CardHeader>
           {getStatusMessage()}
        </CardHeader>
        <CardContent>
             <div className="flex flex-col items-center gap-4 mt-8 border-t pt-6">
                <p className="text-xs text-muted-foreground text-center">
                    Jei norite prisijungti su kita paskyra (pvz. administratoriaus) –
                    atsijunkite žemiau.
                </p>
                <Button variant="outline" onClick={logout}>
                    Atsijungti ir grįžti į prisijungimą
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
