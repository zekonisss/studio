"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Valdymo skydas</h1>
        <p className="text-sm text-muted-foreground">
          Čia matysite savo paskyros santrauką ir greitas nuorodas į pagrindines funkcijas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/reports/add"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">Pridėti naują įrašą</h2>
          <p className="text-xs text-muted-foreground">
            Užregistruokite naują vairuotojo incidentą / įrašą duomenų bazėje.
          </p>
        </Link>

        <Link
          href="/reports/history"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">Mano įrašų istorija</h2>
          <p className="text-xs text-muted-foreground">
            Peržiūrėkite anksčiau pateiktus įrašus, jų statusą ir detales.
          </p>
        </Link>

        <Link
          href="/search"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">Vairuotojų paieška</h2>
          <p className="text-xs text-muted-foreground">
            Patikrinkite kandidatų istoriją prieš priimdami į darbą.
          </p>
        </Link>
      </div>
    </div>
  );
}
