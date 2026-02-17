"use client";

import { ArrowRight, Info, ShieldCheck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/shared/animated-counter"; 
import { useLanguage } from "@/contexts/language-context";

interface HeroProps {
  count: number;
}

export function Hero({ count }: HeroProps) {
  const { t } = useLanguage();
  return (
    <section className="relative flex items-center justify-center min-h-[90vh] overflow-hidden">
      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
        
        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border border-border text-foreground/80 text-sm mb-8 backdrop-blur-md transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
          </span>
          <span>
            {t('landing.hero.badge.text')}{" "}
            <strong className="text-foreground">
               <AnimatedCounter value={count > 0 ? count : 1542} />
            </strong>
          </span>
        </div>

        {/* ANTRAŠTĖ */}
        <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6 leading-tight max-w-5xl mx-auto transition-colors">
          {t('landing.hero.title.line1')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            {t('landing.hero.title.line2')}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed transition-colors">
          {t('landing.hero.subtitle')}
        </p>

        {/* MYGTUKAI */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          
          <a href="/signup">
            <button className="relative group overflow-hidden rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 px-8 py-4 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)]">
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="absolute -inset-[100%] top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              <span className="relative flex items-center gap-3 font-bold text-lg tracking-wide transition-transform duration-300 group-hover:translate-x-1">
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          </a>
          
        </div>

        {/* TRUST MARKERS */}
        <div className="mt-16 pt-8 border-t border-border/20 flex flex-wrap justify-center gap-x-12 gap-y-6 text-muted-foreground opacity-80">
            <div className="flex items-center gap-2 text-sm md:text-base font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>{t('landing.hero.trust1')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base font-medium">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span>{t('landing.hero.trust2')}</span>
            </div>
             <div className="flex items-center gap-2 text-sm md:text-base font-medium">
                <Info className="w-5 h-5 text-slate-500" />
                <span>{t('landing.hero.trust3')}</span>
            </div>
        </div>

      </div>
    </section>
  );
}
