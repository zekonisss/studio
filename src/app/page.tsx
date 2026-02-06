
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { BarChart3, ShieldCheck, FileText, UserSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicReportCount } from "./page-actions";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

// Mūsų komponentai
import { CoverageSection } from "@/components/landing/CoverageSection";
import { Hero } from "@/components/landing/Hero";
import { ApiSection } from "@/components/landing/ApiSection";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [totalReports, setTotalReports] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Užkrauname ataskaitų skaičių Hero komponentui
  useEffect(() => {
    async function fetchData() {
      setIsStatsLoading(true);
      try {
        const count = await getPublicReportCount();
        setTotalReports(count || 0);
      } catch (error) {
        console.error("Failed to fetch page data:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className={cn("flex flex-col min-h-screen text-foreground selection:bg-primary/30", "hero-aurora")}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <UserSearch className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent italic">
              {t('app.name')}
            </span>
          </Link>

          {/* DEŠINĖ PUSĖ */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* "SHINY" LOGIN MYGTUKAS */}
            <a href="/login">
              <button className="relative group overflow-hidden rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 px-6 py-2 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]">
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="absolute -inset-[100%] top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                <span className="relative font-semibold text-sm tracking-wide">
                  {t('login.loginButton')}
                </span>
              </button>
            </a>

          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* 1. HERO (Su dinaminiu skaičiumi) */}
        <Hero count={totalReports} />
        
        {/* 2. ŽEMĖLAPIS (Scale) */}
        <CoverageSection />

        {/* 3. API SEKCIJA (Enterprise) */}
        <ApiSection />

      </main>

      <footer className="border-t border-border py-12 bg-transparent">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-6 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('landing.footer.rights')}</p>
          <div className="flex gap-8">
            <a href="/terms" className="hover:text-primary transition-colors">{t('sidebar.terms')}</a>
            <a href="/privacy" className="hover:text-primary transition-colors">{t('sidebar.privacy')}</a>
            <a href="/support" className="hover:text-primary transition-colors">{t('sidebar.support')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
