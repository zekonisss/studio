"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { ArrowRight, BarChart3, ShieldCheck, FileText, UserSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicReportCount } from "./page-actions";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

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

  useEffect(() => {
    async function fetchTotalReports() {
      setIsStatsLoading(true);
      try {
        const count = await getPublicReportCount();
        setTotalReports(count || 0);
      } catch (error) {
        console.error("Failed to fetch total reports:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }
    fetchTotalReports();
  }, []);

  const Stat = ({ value, label, icon: Icon, loading }: { value: number, label: string, icon: React.ElementType, loading: boolean }) => (
    <div className="flex flex-col items-center text-center gap-2 group p-4">
      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-colors">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-8 w-20 mx-auto mb-1 bg-white/10" />
        ) : (
          <div className="text-3xl font-bold text-white tracking-tighter">
            <AnimatedCounter value={value} />
          </div>
        )}
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-white selection:bg-primary/30">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <UserSearch className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
              {t('app.name')}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" asChild className="text-gray-400 hover:text-white hover:bg-white/5">
              <Link href="/login">{t('login.loginButton')}</Link>
            </Button>
            <Button asChild className="font-semibold shadow-glow-primary transition-all active:scale-95">
              <Link href="/signup">{t('login.signupLink')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-40 md:pb-32 flex flex-col items-center justify-center text-center px-6">
          {/* Neon Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 right-1/4 -z-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] opacity-30" />

          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {t('landing.hero.title')}
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button size="lg" asChild className="h-16 px-10 text-lg shadow-glow-primary transition-all hover:-translate-y-1">
                <Link href="/signup">
                  {t('landing.hero.ctaButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-16 px-10 text-lg border-white/10 hover:bg-white/5 backdrop-blur-md">
                <Link href="/support">{t('landing.hero.secondaryButton')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-16 bg-white/[0.02] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-12 max-w-5xl mx-auto">
              <Stat value={totalReports} label={t('landing.stats.totalReports')} icon={FileText} loading={isStatsLoading} />
              <Stat value={150} label={t('landing.stats.activeCompanies')} icon={ShieldCheck} loading={isStatsLoading} />
              <Stat value={98} label={t('landing.stats.positiveImpact')} icon={BarChart3} loading={isStatsLoading} />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">{t('landing.features.title')}</h2>
              <p className="text-gray-400 text-lg">{t('landing.features.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { icon: ShieldCheck, title: t('landing.features.feature1.title'), desc: t('landing.features.feature1.description') },
                { icon: FileText, title: t('landing.features.feature2.title'), desc: t('landing.features.feature2.description') },
                { icon: BarChart3, title: t('landing.features.feature3.title'), desc: t('landing.features.feature3.description') }
              ].map((f, i) => (
                <Card key={i} className="group p-8 bg-card/50 border-white/10 backdrop-blur-xl transition-all hover:bg-white/[0.07] hover:border-primary/40 rounded-3xl">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <f.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-6 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('landing.footer.rights')}</p>
          <div className="flex gap-8">
            <Link href="/terms" className="hover:text-primary transition-colors">{t('sidebar.terms')}</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">{t('sidebar.privacy')}</Link>
            <Link href="/support" className="hover:text-primary transition-colors">{t('sidebar.support')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
