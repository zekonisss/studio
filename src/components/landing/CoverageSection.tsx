"use client";

import { ShieldCheck, Map, Globe, Activity } from "lucide-react";
import { InteractiveMap } from "./InteractiveMap"; 

export function CoverageSection() {
  return (
    <section className="bg-slate-950 py-24 overflow-hidden relative">
      {/* Fono elementas (dekoracija) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid-pattern.svg')] opacity-5 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* KAIRĖ PUSĖ: Tekstas */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800 text-cyan-400 text-sm font-medium">
              <Activity className="w-4 h-4" />
              <span>Live Region Coverage</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Vieninga duomenų erdvė: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">LT, LV, EE, PL</span>
            </h2>
            
            <p className="text-lg text-slate-400 leading-relaxed">
              Vairuotojai kerta sienas, tikėdamiesi paslėpti savo istoriją. 
              Mes panaikinome „akląsias zonas“. Mūsų sistema realiu laiku apjungia 
              rizikos duomenis iš keturių pagrindinių regiono rinkų.
            </p>

            <div className="space-y-6 pt-4">
              <FeatureItem 
                icon={<Map className="w-5 h-5 text-cyan-400" />}
                title="Regioninis Saugumas"
                description="Matykite pilną vaizdą. Duomenys sinchronizuojami tarp šalių akimirksniu."
              />
              <FeatureItem 
                icon={<Globe className="w-5 h-5 text-cyan-400" />}
                title="Migracijos Kontrolė"
                description="Trečiųjų šalių vairuotojų istorija seka paskui juos, nesvarbu kurioje šalyje jie darbintųsi."
              />
              <FeatureItem 
                icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />}
                title="Prevencinis Poveikis"
                description="Vairuotojai žino – incidentas Lietuvoje užkirs kelią darbui Lenkijoje ar Latvijoje."
              />
            </div>
          </div>

          {/* DEŠINĖ PUSĖ: Tavo interaktyvus žemėlapis */}
          <div className="w-full relative">
            {/* Dekoratyvinis švytėjimas už žemėlapio */}
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            
            {/* Pats žemėlapis */}
            <InteractiveMap />
          </div>

        </div>
      </div>
    </section>
  );
}

// Pagalbinis mažas komponentas sąrašui
function FeatureItem({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-xl hover:bg-white/5 transition duration-300 border border-transparent hover:border-white/10">
      <div className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800 shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
