"use client";

import { UserSearch, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";

// Leidžiame paduoti pasirinktinį tekstą, jei ateityje reikės
export function PremiumLoadingScreen({ customText }: { customText?: string }) {
  const { t } = useLanguage();
  // Pakeičiau pradinį tekstą į neutralų
  const [loadingText, setLoadingText] = useState(customText || "Vykdomi sistemos procesai...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // JEI yra customText, tekstų nebekeičiame (nejudinam masyvo)
    if (customText) return;

    // NAUJI UNIVERSALŪS TEKSTAI (Tinka ir Login, ir Logout)
    const texts = [
      "Vykdomi saugumo protokolai...", // Skamba rimtai
      "Šifruojamas duomenų srautas...", // Tinka visur
      "Sinchronizacija su serveriu...", // Neutralu
      "Atnaujinama informacija..."      // Tinka pabaigai
    ];
    let textIndex = 0;

    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setLoadingText(texts[textIndex]);
    }, 2000); // Keičiasi kas 2 sekundes

    const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            const increment = prev < 50 ? Math.random() * 15 : Math.random() * 5;
            return Math.min(prev + increment, 100);
        });
    }, 500);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [customText]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#020817] text-white">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-40 pointer-events-none animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-12 flex items-center gap-3 animate-in fade-in zoom-in duration-700">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <UserSearch className="h-8 w-8 text-blue-400" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">
                {t('app.name') || 'DriverCheck'}
            </span>
        </div>

        {/* Center Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping opacity-75 delay-300 duration-1000"></div>
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-50 delay-700 duration-1000"></div>
          
          <div className="relative flex items-center justify-center w-24 h-24 bg-[#0F172A] border border-blue-500/30 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] z-20">
            <ShieldCheck className="w-10 h-10 text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Loading Text - Čia rodomas universalus tekstas */}
        <h2 className="text-lg font-medium text-slate-200 mb-2 min-h-[28px] transition-all duration-500 ease-in-out text-center px-4">
            {loadingText}
        </h2>
        
        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden relative mt-4">
            <div 
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute right-0 top-0 h-full w-10 bg-white/30 blur-[5px] transform translate-x-1/2"></div>
            </div>
        </div>

      </div>
    </div>
  );
}