"use client";

import { Terminal, Code2, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export function ApiSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* KAIRĖ PUSĖ: Tekstas */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400 text-sm font-medium transition-colors">
              <Code2 className="w-4 h-4" />
              <span>Developers & Integrations</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
              Integruokite patikras tiesiai į savo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">TMS sistemą.</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
              Nereikia rankinio darbo. Sujunkite savo HR ar Transporto valdymo sistemą 
              su mūsų API ir gaukite vairuotojo rizikos įvertinimą automatiškai 
              įdarbinimo proceso metu.
            </p>

            <div className="space-y-4">
              <BenefitItem text="REST API dokumentacija" />
              <BenefitItem text="Webhooks pranešimams apie naujus incidentus" />
              <BenefitItem text="99.9% veikimo laikas (SLA)" />
              <BenefitItem text="Suderinama su SAP, Workday ir Navision" />
            </div>

            <div className="pt-4">
              <Link href="/api-docs">
                <button className="group flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold hover:gap-3 transition-all">
                  Skaityti dokumentaciją <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* DEŠINĖ PUSĖ: Kodo terminalas */}
          <div className="relative group">
            {/* Glow efektas */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative rounded-xl bg-[#1e1e1e] border border-slate-700 shadow-2xl overflow-hidden">
              
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#252526] border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 text-xs text-slate-400 font-mono flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  check-driver.js
                </div>
              </div>

              {/* Code Content */}
              <div className="p-6 overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed">
                  <code className="text-slate-300">
                    <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> fetch(<span className="text-green-400">"https://api.system.com/v1/check"</span>, {"{"}
                    {"\n"}  method: <span className="text-green-400">"POST"</span>,
                    {"\n"}  headers: {"{"} 
                    {"\n"}    <span className="text-green-400">"Authorization"</span>: <span className="text-green-400">"Bearer sk_live_..."</span> 
                    {"\n"}  {"}"},
                    {"\n"}  body: JSON.stringify({"{"}
                    {"\n"}    driverId: <span className="text-green-400">"LT-890123-XXXX"</span>
                    {"\n"}  {"}"})
                    {"\n"}{"}"});
                    {"\n"}
                    {"\n"}<span className="text-slate-500">// Atsakymas iš sistemos:</span>
                    {"\n"}console.log(<span className="text-purple-400">await</span> response.json());
                    {"\n"}
                    {"\n"}<span className="text-yellow-400">{"{"}</span>
                    {"\n"}  <span className="text-blue-400">"status"</span>: <span className="text-green-400">"active"</span>,
                    {"\n"}  <span className="text-blue-400">"riskScore"</span>: <span className="text-red-400">85</span>, <span className="text-slate-500">// Aukšta rizika!</span>
                    {"\n"}  <span className="text-blue-400">"incidents"</span>: <span className="text-yellow-400">3</span>
                    {"\n"}<span className="text-yellow-400">{"}"}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      </div>
      <span className="text-slate-700 dark:text-slate-300 font-medium">{text}</span>
    </div>
  );
}