"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { ArrowRight, BarChart3, ShieldCheck, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllReports } from "@/lib/storage";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { UserSearch } from "lucide-react";


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
        const reports = await getAllReports();
        setTotalReports(reports.filter(r => r.status === 'active').length);
      } catch (error) {
        console.error("Failed to fetch total reports:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }
    fetchTotalReports();
  }, []);

  const Stat = ({ value, label, icon: Icon, loading }: { value: number, label: string, icon: React.ElementType, loading: boolean }) => (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary/10 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        {loading ? <Skeleton className="h-7 w-20 mb-1" /> : <div className="text-2xl font-bold"><AnimatedCounter value={value} /></div>}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <UserSearch className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t('login.loginButton')}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">{t('login.signupLink')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center hero-aurora">
          <div className="container px-4 md:px-6 relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-down bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t('landing.hero.title')}
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex justify-center gap-4 animate-fade-in">
              <Button size="lg" asChild className="shadow-md hover:shadow-glow-primary transition-shadow duration-300">
                <Link href="/signup">
                  {t('landing.hero.ctaButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/support">{t('landing.hero.secondaryButton')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/50">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <Stat value={totalReports} label={t('landing.stats.totalReports')} icon={FileText} loading={isStatsLoading} />
                    <Stat value={150} label={t('landing.stats.activeCompanies')} icon={ShieldCheck} loading={isStatsLoading} />
                    <Stat value={98} label={t('landing.stats.positiveImpact')} icon={BarChart3} loading={isStatsLoading} />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('landing.features.title')}</h2>
                    <p className="max-w-xl mx-auto mt-4 text-muted-foreground">{t('landing.features.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="text-center p-6 bg-card/80 dark:bg-card/40 backdrop-blur-sm border border-border/20 transition-all duration-300 hover:shadow-glow-primary hover:border-primary/40">
                        <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('landing.features.feature1.title')}</h3>
                        <p className="text-muted-foreground">{t('landing.features.feature1.description')}</p>
                    </Card>
                     <Card className="text-center p-6 bg-card/80 dark:bg-card/40 backdrop-blur-sm border border-border/20 transition-all duration-300 hover:shadow-glow-primary hover:border-primary/40">
                        <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('landing.features.feature2.title')}</h3>
                        <p className="text-muted-foreground">{t('landing.features.feature2.description')}</p>
                    </Card>
                     <Card className="text-center p-6 bg-card/80 dark:bg-card/40 backdrop-blur-sm border border-border/20 transition-all duration-300 hover:shadow-glow-primary hover:border-primary/40">
                        <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('landing.features.feature3.title')}</h3>
                        <p className="text-muted-foreground">{t('landing.features.feature3.description')}</p>
                    </Card>
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-4 md:px-6 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('landing.footer.rights')}</p>
          <div className="flex gap-4">
              <Link href="/terms" className="hover:text-primary">{t('sidebar.terms')}</Link>
              <Link href="/privacy" className="hover:text-primary">{t('sidebar.privacy')}</Link>
              <Link href="/support" className="hover:text-primary">{t('sidebar.support')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
