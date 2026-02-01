"use client";

import { Globe, Users, Scale, Server, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function DataSourcesSection() {
  const { t } = useLanguage();
  return (
    <section id="sources" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Antraštė */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6">
            <Server className="w-4 h-4" />
            <span>{t('landing.datasources.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            {t('landing.datasources.title.line1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {t('landing.datasources.title.line2')}
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('landing.datasources.subtitle')}
          </p>
        </div>

        {/* Kortelės */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. Viešoji Erdvė (Pakeista pagal tavo prašymą) */}
          <SourceCard 
            icon={<Globe className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            title={t('landing.datasources.card1.title')}
            description={t('landing.datasources.card1.description')}
            list={[
              t('landing.datasources.card1.item1'),
              t('landing.datasources.card1.item2'),
              t('landing.datasources.card1.item3')
            ]}
          />

          {/* 2. Partnerių Bendruomenė */}
          <SourceCard 
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-indigo-500"
            title={t('landing.datasources.card2.title')}
            description={t('landing.datasources.card2.description')}
            list={[
              t('landing.datasources.card2.item1'),
              t('landing.datasources.card2.item2'),
              t('landing.datasources.card2.item3')
            ]}
          />

          {/* 3. Teisinis Atitikimas */}
          <SourceCard 
            icon={<Scale className="w-6 h-6 text-white" />}
            color="bg-emerald-500"
            title={t('landing.datasources.card3.title')}
            description={t('landing.datasources.card3.description')}
            list={[
              t('landing.datasources.card3.item1'),
              t('landing.datasources.card3.item2'),
              t('landing.datasources.card3.item3')
            ]}
          />

        </div>
      </div>
    </section>
  );
}

function SourceCard({ icon, color, title, description, list }: { icon: any, color: string, title: string, description: string, list: string[] }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>
      <ul className="space-y-3">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
