"use client";

import { ShieldCheck, Map, Globe, Activity } from "lucide-react";
import { InteractiveMap } from "./InteractiveMap"; 
import { useLanguage } from "@/contexts/language-context";

export function CoverageSection() {
  const { t } = useLanguage();
  return (
    <section className="py-24 overflow-hidden relative transition-colors duration-300">
      
      {/* Tinklelis tamsiam režimui */}
      

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Tekstas */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-400 text-sm font-medium transition-colors">
              <Activity className="w-4 h-4" />
              <span>{t('landing.coverage.badge')}</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
              {t('landing.coverage.title')}
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
              {t('landing.coverage.subtitle')}
            </p>

            <div className="space-y-6 pt-4">
              <FeatureItem 
                icon={<Map className="w-5 h-5 text-blue-600 dark:text-cyan-400" />}
                title={t('landing.coverage.feature1.title')}
                description={t('landing.coverage.feature1.description')}
              />
              <FeatureItem 
                icon={<Globe className="w-5 h-5 text-blue-600 dark:text-cyan-400" />}
                title={t('landing.coverage.feature2.title')}
                description={t('landing.coverage.feature2.description')}
              />
              <FeatureItem 
                icon={<ShieldCheck className="w-5 h-5 text-blue-600 dark:text-cyan-400" />}
                title={t('landing.coverage.feature3.title')}
                description={t('landing.coverage.feature3.description')}
              />
            </div>
          </div>

          {/* Žemėlapis */}
          <div className="w-full relative">
             {/* Glow efektas tik tamsiam režimui */}
            <div className="hidden dark:block absolute -inset-4 bg-cyan-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            
            <InteractiveMap />
          </div>

        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition duration-300 border border-transparent dark:hover:border-white/10">
      <div className="mt-1 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
