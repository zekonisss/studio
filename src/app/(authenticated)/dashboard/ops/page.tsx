"use client";

import { useState } from 'react';
import { OpsUploadZone } from "@/components/ops/OpsUploadZone";
import { FineCard } from "@/components/ops/FineCard";
import { TachoTimeline } from "@/components/ops/TachoTimeline";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GanttChartSquare, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

// --- Types & Mock Data ---
interface FineData {
    date: string;
    time: string;
    amount: string;
    location: string;
    violation: string;
    status: 'Pending' | 'Paid';
}
interface Activity {
  type: 'DRIVE' | 'WORK' | 'REST' | 'BREAK' | 'UNKNOWN';
  startTime: string;
  duration: number; // in minutes
}

const MOCK_FINE_DATA: FineData = { 
    date: '2024-02-09', 
    time: '12:30', 
    amount: '150.00 €', 
    location: 'A2, Vokietija', 
    violation: 'Viršytas vairavimo laikas', 
    status: 'Pending' 
};

// The conflict is here: Fine at 12:30 is during a DRIVE period (11:30 - 14:00)
const MOCK_TACHO_DATA: Activity[] = [
  { type: 'REST',    startTime: '00:00', duration: 360 }, // 6h rest
  { type: 'WORK',    startTime: '06:00', duration: 15 },  // 15m pre-drive check
  { type: 'DRIVE',   startTime: '06:15', duration: 270 }, // 4.5h drive
  { type: 'BREAK',   startTime: '10:45', duration: 45 },  // 45m break
  { type: 'DRIVE',   startTime: '11:30', duration: 150 }, // 2.5h drive
  { type: 'WORK',    startTime: '14:00', duration: 30 },  // 30m unloading
  { type: 'DRIVE',   startTime: '14:30', duration: 90 },  // 1.5h drive
  { type: 'UNKNOWN', startTime: '16:00', duration: 15 },  // 15m unknown error
  { type: 'REST',    startTime: '16:15', duration: 465 }, // Remaining rest
];


export default function OpsCenterPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fineData, setFineData] = useState<FineData | null>(null);
  const [tachoData, setTachoData] = useState<Activity[] | null>(null);

  const handleUpload = (files: File[]) => {
    setIsProcessing(true);
    let processedCount = 0;

    const onDone = () => {
        processedCount++;
        if (processedCount === files.length) {
            setIsProcessing(false);
        }
    };

    files.forEach(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        setTimeout(() => {
            if (fileExtension === 'ddd') {
                setTachoData(MOCK_TACHO_DATA);
            } else if (['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension || '')) {
                setFineData(MOCK_FINE_DATA);
            }
            onDone();
        }, 1500);
    });
  };
  
  const generateAppealPDF = async () => {
    const doc = new jsPDF();
    
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    const blob = await response.blob();
    
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    await new Promise<void>((resolve) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const cleanBase64 = base64data.split(',')[1];
        
        doc.addFileToVFS('Roboto-Regular.ttf', cleanBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
        resolve();
      };
    });

    const currentDate = new Date().toLocaleDateString('lt-LT');
    const driverName = "Jonas Jonaitis";

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text("PAAIŠKINIMAS DĖL VAIRAVIMO REŽIMO PAŽEIDIMO", 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Vairuotojas: ${driverName}`, 20, 40);
    doc.text(`Data: ${currentDate}`, 20, 50);

    const bodyText = `Vadovaujantis Europos Parlamento ir Tarybos reglamentu (EB) Nr. 561/2006, noriu paaiškinti, kad užfiksuotas vairavimo laiko pažeidimas įvyko dėl nenumatytų aplinkybių (kamščių / priverstinio sustojimo), siekiant užtikrinti krovinio ir transporto priemonės saugumą.`;
    const splitBody = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBody, 20, 70);
    
    doc.setFont(undefined, 'bold');
    doc.text("Užfiksuotas laikas: 12:30 (Vairavimas pagal Tacho) vs 12:30 (Bauda).", 20, 110);
    
    doc.setFont(undefined, 'normal');
    doc.text("Parašas: _________________", 20, 140);
    
    doc.save(`apeliacija_${driverName.replace(/\s+/g, '_')}.pdf`);
  };

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-lg font-medium">Analizuojami failai...</p>
        </div>
      );
    }
    
    const showConflict = fineData && tachoData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start animate-in fade-in-50">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <OpsUploadZone onFilesSelected={handleUpload} />
          {fineData && <FineCard data={fineData} />}
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-3 space-y-8">
            {tachoData && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-muted rounded-lg">
                            <GanttChartSquare className="w-6 h-6 text-muted-foreground"/>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Vairuotojo laiko juosta (24h)</h3>
                    </div>
                    <TachoTimeline activities={tachoData} />
                </div>
            )}
            
            {showConflict && (
                <>
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-500/30 rounded-2xl shadow-lg shadow-red-500/5 animate-in fade-in-50">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="font-bold">KONFLIKTAS: laikai nesutampa!</AlertTitle>
                        <AlertDescription>
                          Baudos laikas ({fineData.time}) sutampa su 'VAIRAVIMAS' periodu tachografe. Rekomenduojama generuoti apeliaciją.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-4 pt-4">
                        <Button 
                            size="lg" 
                            className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-12 text-base font-semibold"
                            onClick={generateAppealPDF}
                        >
                            Generuoti Apeliaciją
                        </Button>
                        <Button size="lg" variant="outline" className="w-full text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300 h-12 text-base font-semibold">
                            Išskaičiuoti iš atlyginimo
                        </Button>
                    </div>
                </>
            )}

            {!fineData && !tachoData && !isProcessing && (
                <div className="h-96 rounded-2xl border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <p>Įkelkite failus, kad pamatytumėte analizę.</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          OPS Centras
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Baudų ir Tacho failų analizė, apeliacijos generavimas.
        </p>
      </header>
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
