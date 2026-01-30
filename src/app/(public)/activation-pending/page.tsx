"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, ShieldCheck, AlertTriangle, Banknote } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import Link from 'next/link';

type PaymentMethod = 'card' | 'bank_transfer';

export default function ActivationPendingPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethod | null>(null);

  const handlePayment = async (method: PaymentMethod) => {
    if (!user) return;
    setLoadingMethod(method);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, paymentMethod: method }),
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
      setLoadingMethod(null);
    }
  };

  const getStatusComponent = () => {
    let title: string;
    let description: string;
    const status = user?.paymentStatus;

    switch (status) {
        case 'pending_verification':
            title = t('account.payments.status.pending_verification.title');
            description = t('account.payments.status.pending_verification.description');
            break;
        case 'trial':
            title = t('account.payments.status.trial.title');
            description = t('account.payments.status.trial.description', { searchCredits: user?.searchCredits ?? 0, reportCredits: user?.reportCredits ?? 0 });
            break;
        case 'inactive':
        case 'pending_payment':
            title = t('account.payments.status.inactive.title');
            description = t('account.payments.status.inactive.description');
            break;
        default:
            title = "Nežinoma būsena";
            description = "Susisiekite su palaikymo komanda.";
            break;
    }

    return (
         <>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-muted-foreground text-center mt-2 max-w-md mx-auto">
                {description}
            </CardDescription>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => handlePayment('card')} disabled={!!loadingMethod} size="lg" className="w-full sm:w-auto">
                    {loadingMethod === 'card' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Mokėti kortele (prenumerata)
                </Button>
                <Button onClick={() => handlePayment('bank_transfer')} disabled={!!loadingMethod} size="lg" variant="outline" className="w-full sm:w-auto">
                    {loadingMethod === 'bank_transfer' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                    Gauti sąskaitą pavedimui
                </Button>
            </div>
         </>
    );
  }

  return (
    <Card className="w-full max-w-2xl rounded-xl border p-6 sm:p-8 text-center shadow-glow-primary bg-card/80 dark:bg-card/40 backdrop-blur-sm">
      <CardHeader className="p-0">
         {getStatusComponent()}
      </CardHeader>
      <CardContent className="p-0">
           <div className="flex flex-col items-center gap-4 mt-8 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                  Norite peržiūrėti ar pakeisti paskyros duomenis?{' '}
                  <Link href="/authenticated/account" className="font-semibold text-primary underline-offset-4 hover:underline">
                      Eiti į paskyros valdymą
                  </Link>
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs mt-2">
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
