"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function ActivationPendingPage() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-xl rounded-xl border bg-card p-8 shadow-xl text-center">
        <h1 className="mb-4 text-3xl font-bold">
          Paskyra sukurta, laukiama aktyvavimo
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Jūsų paskyra sėkmingai užregistruota. Mūsų komanda patikrins
          informaciją ir aktyvuos prieigą po apmokėjimo. Apie aktyvavimą
          būsite informuoti el. paštu.
        </p>

        <div className="flex flex-col items-center gap-4 mt-8 border-t pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Jei norite prisijungti su kita paskyra (pvz. administratoriaus) –
            atsijunkite žemiau.
          </p>
          <Button variant="outline" onClick={logout}>
            Atsijungti ir grįžti į prisijungimą
          </Button>
        </div>
      </div>
    </div>
  );
}
