"use client";

import { OpsUploadZone } from "@/components/ops/OpsUploadZone";
import { FineCard } from "@/components/ops/FineCard";
import { TachoTimeline } from "@/components/ops/TachoTimeline";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GanttChartSquare } from 'lucide-react';

export default function OpsCenterPage() {
  const showDiscrepancy = true; // For mockup purposes

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          OPS Centras
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Baudų ir Tacho failų analizė, apeliacijos generavimas.
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* Left Column: Upload and Details */}
        <div className="lg:col-span-2 space-y-8">
          <OpsUploadZone />
          <FineCard />
          <div className="space-y-4 pt-4">
              <Button size="lg" className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-12 text-base font-semibold">
                  Generuoti Apeliaciją
              </Button>
              <Button size="lg" variant="outline" className="w-full text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300 h-12 text-base font-semibold">
                  Išskaičiuoti iš atlyginimo
              </Button>
          </div>
        </div>
        
        {/* Right Column: Visual Analysis */}
        <div className="lg:col-span-3 space-y-8">
          <div className="p-6 bg-card border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-muted rounded-lg">
                      <GanttChartSquare className="w-6 h-6 text-muted-foreground"/>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Vairuotojo laiko juosta (24h)</h3>
              </div>
              <TachoTimeline />
          </div>

          {showDiscrepancy && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-500/30 rounded-2xl shadow-lg shadow-red-500/5 animate-in fade-in-50">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-bold">Užfiksuotas neatitikimas!</AlertTitle>
                  <AlertDescription>
                      Bauda gauta vairuotojo poilsio metu. Rekomenduojama generuoti apeliaciją.
                  </AlertDescription>
              </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
