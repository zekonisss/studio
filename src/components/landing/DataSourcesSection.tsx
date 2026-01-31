"use client";

import { Globe, Users, Scale, Server, CheckCircle2 } from "lucide-react";

export function DataSourcesSection() {
  return (
    <section id="sources" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Antraštė */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6">
            <Server className="w-4 h-4" />
            <span>Duomenų Kilmė ir Skaidrumas</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Informacija, kuria galite <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              pasitikėti.
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Mūsų sistema veikia kaip informacijos agregatorius. Mes sujungiame 
            bendruomenės pranešimus, viešai prieinamą informaciją ir teisinius saugiklius 
            į vieną patogų įrankį.
          </p>
        </div>

        {/* Kortelės */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. Viešoji Erdvė (Pakeista pagal tavo prašymą) */}
          <SourceCard 
            icon={<Globe className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            title="Viešoji Erdvė"
            description="Agreguojame informaciją, kuri yra išbarstyta internete, kad jums nereikėtų gaišti laiko naršant dešimtis skirtingų šaltinių."
            list={[
              "Specializuoti forumai ir grupės",
              "Socialinių tinklų monitoringas",
              "Viešai prieinami atsiliepimai"
            ]}
          />

          {/* 2. Partnerių Bendruomenė */}
          <SourceCard 
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-indigo-500"
            title="Vežėjų Bendruomenė"
            description="Uždaras patikimų transporto įmonių tinklas dalinasi vidiniais incidentų pranešimais realiu laiku."
            list={[
              "Kuro vagysčių pranešimai su įrodymais",
              "Transporto priemonės apgadinimai",
              "Piktybiniai darbo sutarties pažeidimai"
            ]}
          />

          {/* 3. Teisinis Atitikimas */}
          <SourceCard 
            icon={<Scale className="w-6 h-6 text-white" />}
            color="bg-emerald-500"
            title="Teisinis Filtravimas"
            description="Kiekvienas įrašas praeina automatinį ir rankinį teisinį patikrinimą, kad atitiktų duomenų apsaugos įstatymus."
            list={[
              "Duomenų nuasmeninimas (kur būtina)",
              "Teisėtas interesas (Legitimate Interest)",
              "Ginčų sprendimo mechanizmas"
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