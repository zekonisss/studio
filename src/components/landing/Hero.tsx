"use client";

import { ArrowRight, Info, ShieldCheck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PublicReportCounter } from "@/components/shared/PublicReportCounter";
import { useLanguage } from "@/contexts/language-context";

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* Fono efektas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-100 dark:bg-blue-900/10 rounded-full blur-[100px] -z-10 opacity-60"></div>

      <div className="container mx-auto px-4 md:px-6 text-center">
        
        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm mb-8 backdrop-blur-md transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>
            {t('landing.hero.badge.pre')}{" "}
            <strong className="text-slate-900 dark:text-white">
               <PublicReportCounter fallbackCount={1542} />
            </strong>
          </span>
        </div>

        {/* ANTRAŠTĖ */}
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight max-w-5xl mx-auto transition-colors">
          {t('landing.hero.title.line1')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
            {t('landing.hero.title.line2')}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed transition-colors">
          {t('landing.hero.subtitle')}
        </p>

        {/* MYGTUKAI */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          
          <Link href="/signup">
            <button className="relative group overflow-hidden rounded-xl bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 px-8 py-4 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] dark:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.7)]">
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="absolute -inset-[100%] top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              <span className="relative flex items-center gap-3 font-bold text-lg tracking-wide transition-transform duration-300 group-hover:translate-x-1">
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          </Link>
          
          {/* ŠIS MYGTUKAS DABAR SKROLINA IKI #sources SEKCIJOS */}
          <a href="#sources">
            <button className="group px-8 py-4 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-lg transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer">
              <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t('landing.hero.secondaryAction')}</span>
            </button>
          </a>

        </div>

        {/* TRUST MARKERS */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800/40 flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-80">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                <span>{t('landing.hero.trust1')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                <span>{t('landing.hero.trust2')}</span>
            </div>
             <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
                <Info className="w-5 h-5 text-slate-500" />
                <span>{t('landing.hero.trust3')}</span>
            </div>
        </div>

      </div>
    </section>
  );
}
