"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

// SVARBU: "export default" privalo būti čia
export default function HomePage() {
  const router = useRouter();
  const { login } = useAuth(); // Čia dabar veiks, nes sutvarkėme use-auth.tsx

  const handleRegisterRedirect = (role: string) => {
    // Nukreipiame į /signup, nes tai veikiantis kelias
    router.push(`/signup?role=${role}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 bg-background">
      <h1 className="text-4xl font-bold text-primary">DriverCheck</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
        <button 
          onClick={() => handleRegisterRedirect('carrier')}
          className="flex flex-col items-center p-8 border-2 border-blue-500 rounded-xl hover:bg-blue-50 transition-colors"
        >
          <span className="text-xl font-semibold">Transporto įmonė</span>
          <span className="text-sm text-muted-foreground mt-2">Registruotis kaip vežėjas</span>
        </button>

        <button 
          onClick={() => handleRegisterRedirect('partner')}
          className="flex flex-col items-center p-8 border-2 border-green-500 rounded-xl hover:bg-green-50 transition-colors"
        >
          <span className="text-xl font-semibold">Partneris</span>
          <span className="text-sm text-muted-foreground mt-2">Registruotis kaip sandėlis/terminalas</span>
        </button>
      </div>

      <button 
        onClick={() => router.push('/login')}
        className="text-sm underline text-muted-foreground hover:text-primary"
      >
        Jau turite paskyrą? Prisijunkite
      </button>
    </div>
  );
}