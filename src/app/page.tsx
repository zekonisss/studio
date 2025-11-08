"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Laukiame, kol baigsis autentifikacijos tikrinimas
    if (!loading) {
      // Jei vartotojas yra prisijungęs, nukreipiame į prietaisų skydelį
      if (user) {
        router.replace('/dashboard');
      } else {
        // Jei vartotojo nėra, nukreipiame į prisijungimo puslapį
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Kol vyksta tikrinimas, rodome krovimosi ikoną.
  // Tai užtikrina, kad nebus peršokimų tarp puslapių.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
