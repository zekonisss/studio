
"use client";

import { useState, useEffect } from 'react';
import { OpsUploadZone } from "@/components/ops/OpsUploadZone";
import { FineCard } from "@/components/ops/FineCard";
import { TachoTimeline } from "@/components/ops/TachoTimeline";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GanttChartSquare, CheckCircle2, Info, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { analyzeDiscrepancy, type FineData, type Activity, type AnalysisResult } from '@/lib/ops/cross-check';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';


// --- Mock Data for Tacho ---
const MOCK_TACHO_DATA: Activity[] = [
  { type: 'REST',    startTime: '00:00', duration: 360 }, // 6h rest
  { type: 'WORK',    startTime: '06:00', duration: 15 },  // 15m pre-drive check
  { type: 'DRIVE',   startTime: '06:15', duration: 270 }, // 4.5h drive
  { type: 'BREAK',   startTime: '10:45', duration: 45 },  // 45m break (10:45 - 11:30)
  { type: 'DRIVE',   startTime: '11:30', duration: 150 }, // 2.5h drive
  { type: 'WORK',    startTime: '14:00', duration: 30 },  // 30m unloading
  { type: 'DRIVE',   startTime: '14:30', duration: 90 },  // 1.5h drive
  { type: 'UNKNOWN', startTime: '16:00', duration: 15 },  // 15m unknown error
  { type: 'REST',    startTime: '16:15', duration: 465 }, // Remaining rest
];

const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="flex h-48 flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
);


export default function OpsCenterPage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [fineData, setFineData] = useState<FineData | null>(null);
  const [tachoData, setTachoData] = useState<Activity[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [isFineLoading, setIsFineLoading] = useState(false);
  const [isTachoLoading, setIsTachoLoading] = useState(false);


  useEffect(() => {
    if (fineData && tachoData) {
      const result = analyzeDiscrepancy(fineData, tachoData);
      setAnalysisResult(result);
    } else {
      setAnalysisResult(null); // Reset if one of the files is missing
    }
  }, [fineData, tachoData]);

  const handleFineUpload = async (file: File) => {
    setIsFineLoading(true);
    setFineData(null); // Clear previous fine data

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/ops/analyze-fine', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('ops.toast.error.description'));
      }
      
      const realData = await response.json();
      setFineData({ ...realData, status: 'Pending' }); 
      toast({
          title: t('ops.toast.success.title'),
          description: t('ops.toast.success.description'),
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t('ops.toast.error.title'),
        description: error.message || t('ops.toast.error.description'),
      });
    } finally {
      setIsFineLoading(false);
    }
  };
  
  const handleTachoUpload = (file: File) => {
    setIsTachoLoading(true);
    setTachoData(null);
    
    // Simulate reading the binary file
    setTimeout(() => {
      setTachoData(MOCK_TACHO_DATA);
      setIsTachoLoading(false);
    }, 1500);
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
    doc.text(t('ops.pdf.title'), 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('ops.pdf.driver')}: ${driverName}`, 20, 40);
    doc.text(`${t('ops.pdf.date')}: ${currentDate}`, 20, 50);

    const bodyText = t('ops.pdf.body', { fineTime: fineData?.time || 'N/A' });
    const splitBody = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBody, 20, 70);
    
    doc.setFont(undefined, 'bold');
    doc.text(`${t('ops.pdf.discrepancy')}: ${analysisResult?.messageKey ? t(analysisResult.messageKey, analysisResult.messageParams) : 'Nenurodyta'}`, 20, 110);
    
    doc.setFont(undefined, 'normal');
    doc.text(`${t('ops.pdf.signature')}: _________________`, 20, 140);
    
    doc.save(t('ops.pdf.fileName', { driverName: driverName.replace(/\s+/g, '_') }));
  };

  const AnalysisAlert = () => {
    if (!analysisResult || !analysisResult.messageKey) return null;

    const message = t(analysisResult.messageKey, { ...analysisResult.messageParams, activityType: t(`ops.timeline.activity.${analysisResult.messageParams?.activityType}`) });

    if (analysisResult.status === 'CONFLICT') {
       return (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-500/30 rounded-2xl shadow-lg shadow-red-500/5 animate-in fade-in-50">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-bold">{t('ops.analysis.conflictTitle')}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
          </Alert>
       )
    }

     if (analysisResult.status === 'MATCH') {
       return (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500/30 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              <AlertTitle className="font-bold">{t('ops.analysis.matchTitle')}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
          </Alert>
       )
    }

     if (analysisResult.status === 'ERROR') {
       return (
          <Alert variant="destructive" className="rounded-2xl">
              <Info className="h-5 w-5" />
              <AlertTitle className="font-bold">{t('ops.analysis.errorTitle')}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
          </Alert>
       )
    }

    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {t('ops.title')}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('ops.description')}
        </p>
      </header>
      
       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {isFineLoading ? (
            <LoadingSpinner text={t('ops.processing.title')} />
          ) : fineData ? (
            <FineCard data={fineData} />
          ) : (
            <OpsUploadZone 
              title={t('ops.fineProtocol.title')}
              description={t('ops.fineProtocol.description')}
              accept="application/pdf,image/jpeg,image/png"
              onFileSelect={handleFineUpload}
              icon="document"
            />
          )}
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-3 space-y-8">
          {isTachoLoading ? (
             <LoadingSpinner text={t('ops.processing.tacho')} />
          ) : tachoData ? (
            <div className="p-6 bg-card border rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-muted rounded-lg">
                        <GanttChartSquare className="w-6 h-6 text-muted-foreground"/>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{t('ops.timeline.title')}</h3>
                </div>
                <TachoTimeline activities={tachoData} />
            </div>
          ) : (
            <OpsUploadZone 
              title={t('ops.tachoFile.title')}
              description={t('ops.tachoFile.description')}
              accept=".ddd,.v1b"
              onFileSelect={handleTachoUpload}
              icon="tacho"
            />
          )}
          
          {fineData && tachoData && (
             <div className="space-y-4 pt-4">
                <AnalysisAlert />

                {analysisResult?.status === 'CONFLICT' && (
                     <Button 
                        size="lg" 
                        className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-12 text-base font-semibold"
                        onClick={generateAppealPDF}
                    >
                        {t('ops.generateAppealButton')}
                    </Button>
                )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
