"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/shared/payment-modal";
import { CreditCard, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivationPendingPage() {
  const { user, logout } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  return (
    <>
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Paskyra sukurta, laukiama aktyvavimo</CardTitle>
          <CardDescription>Jūsų paskyra sėkmingai užregistruota. Kad galėtumėte pradėti naudotis sistema ir tikrinti vairuotojus, prašome aktyvuoti narystę.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-primary">Narystės aktyvavimas</h3>
            <p className="text-sm text-muted-foreground">Atlikus mokėjimą, prieiga prie duomenų bazės bus suteikta nedelsiant.</p>
            <Button size="lg" className="w-full font-bold shadow-md" onClick={() => setIsPaymentOpen(true)}>
              <CreditCard className="mr-2 h-5 w-5" />
              Aktyvuoti paskyrą dabar
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-6 border-t">
          <p className="text-xs text-muted-foreground">Norite prisijungti su kita paskyra?</p>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Atsijungti
          </Button>
        </CardFooter>
      </Card>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)}
        userId={user?.id || ''}
        email={user?.email || ''}
      />
    </>
  );
}
