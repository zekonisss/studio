
"use client";

import { useState, ChangeEvent, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react"; 
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Report } from '@/types';
// import { categorizeReport } from '@/ai/flows/categorize-report-flow'; // Bus naudojama vėliau
import { getReportsFromLocalStoragePublic, saveReportsToLocalStoragePublic } from '@/types';
import { useRouter } from "next/navigation";

// interface ParsedRow {
//   originalRow: Record<string, any>;
//   reportPreview: Partial<Report>;
//   aiStatus: 'pending' | 'processing' | 'completed' | 'error';
//   aiResult?: { categoryId: string; suggestedTags: string[] }; 
//   error?: string;
// }

export default function ImportReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  // const [parsedData, setParsedData] = useState<ParsedRow[]>([]); // Bus naudojama vėliau su AI
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  // const [isProcessingAi, setIsProcessingAi] = useState(false); // Bus naudojama vėliau su AI
  // const [isImporting, setIsImporting] = useState(false); // Bus naudojama vėliau su AI
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        variant: "destructive",
        title: "Prieiga Negalima", // Reikės pridėti vertimą
        description: "Neturite teisių pasiekti šį puslapį.", // Reikės pridėti vertimą
      });
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, toast]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        // setParsedData([]); // Bus naudojama vėliau
      } else {
        toast({
          variant: "destructive",
          title: t('reports.import.toast.invalidFileType.title'),
          description: t('reports.import.toast.invalidFileType.description'),
        });
        setFile(null);
        setFileName(null);
        event.target.value = "";
      }
    }
  };

  const handleParseFile = async () => {
    if (!file || !user) return;
    setIsLoadingFile(true);
    // setParsedData([]); // Bus naudojama vėliau

    // Placeholder for parsing and AI processing logic
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    toast({
        title: "Failo analizė (DEMO)",
        description: "Šiuo metu failo turinys nėra apdorojamas. Funkcionalumas bus pridėtas vėliau.",
    });

    setIsLoadingFile(false);
  };

  const handleImportData = async () => {
    // Placeholder for import logic
    toast({
        title: "Importavimas (DEMO)",
        description: "Duomenų importavimas į sistemą bus įgyvendintas vėliau.",
    });
  };


  if (authLoading || (!user || !user.isAdmin)) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FileSpreadsheet className="mr-3 h-7 w-7 text-primary" />
            {t('reports.import.title')}
          </CardTitle>
          <CardDescription>
            {t('reports.import.description')}
             <br/>
            {/* Laikinai rodome tikėtinas antraštes, vėliau bus galima konfigūruoti */}
            {t('reports.import.expectedHeaders', { headers: "Title, Company, Comment1, Comment2"})}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Input
              id="excel-file-input"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isLoadingFile}
            />
            <Button onClick={handleParseFile} disabled={!file || isLoadingFile} className="w-full sm:w-auto">
              {isLoadingFile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isLoadingFile ? t('reports.import.button.parsing') : t('reports.import.button.parseFile')}
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground">{t('reports.import.selectedFile')}: {fileName}</p>}
          
          {/* Peržiūros lentelė bus pridėta vėliau */}
          {/* {parsedData.length > 0 && ( ... ) } */}

        </CardContent>
        {/* Importavimo mygtukas bus aktyvus, kai bus duomenų peržiūroje */}
        {/* {parsedData.length > 0 && ( */}
        <CardFooter>
            <Button onClick={handleImportData} disabled={true || isLoadingFile} className="w-full sm:w-auto ml-auto">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {t('reports.import.button.importAll', { count: 0 })}
            </Button>
        </CardFooter>
        {/* )} */}
      </Card>
    </div>
  );
}
