"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider"; // Jei naudoji
import { LanguageProvider } from "@/contexts/language-context"; // Jei naudoji

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* AuthProvider turi būti čia, kad visi matytų vartotojo būseną */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}