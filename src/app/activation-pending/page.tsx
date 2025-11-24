"use client";

export default function ActivationPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded-xl border bg-card p-6 shadow-xl text-center">
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          Paskyra sukurta, laukiama aktyvavimo
        </h1>
        <p className="text-sm text-muted-foreground">
          Jūsų paskyra sėkmingai užregistruota. 
          Mūsų komanda patikrins informaciją ir aktyvuos prieigą po apmokėjimo.
          Apie aktyvavimą būsite informuoti el. paštu.
        </p>
      </div>
    </div>
  );
}
