
"use client";

import { useState, useMemo, useCallback, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, FileUp, AlertCircleIcon, Check, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Report } from '@/types';
import { getCategoryNameForDisplay } from '@/types';
import * as storage from '@/lib/storage';
import { useRouter } from "next/navigation";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { Timestamp } from 'firebase/firestore';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';

type RowStatus = 'pending' | 'processing' | 'completed' | 'error' | 'ai-error';

interface ParsedReportRow {
  id: number;
  fullName: string;
  comment: string;
  date: string;
  status: RowStatus;
  aiCategory?: string;
  aiTags?: string[];
  errorMessage?: string;
}

const REQUIRED_HEADERS_LT = ["Vardas Pavardė", "Komentaras", "Data"];

export default function ImportReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReportRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAiProcessing, startAiTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        variant: "destructive",
        title: t('reports.import.toast.accessDenied.title'),
        description: t('reports.import.toast.accessDenied.description'),
      });
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, toast, t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx'))) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setParsedData([]);
      setProgress(0);
    } else {
      toast({ variant: "destructive", title: t('reports.import.toast.invalidFileType.title'), description: t('reports.import.toast.invalidFileType.description') });
      setFile(null);
      setFileName(null);
      event.target.value = "";
    }
  };

  const handleParseAndCategorize = useCallback(async () => {
    if (!file) return;
    setIsLoadingFile(true);
    setParsedData([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];

        if (jsonData.length < 2) {
          toast({ variant: "destructive", title: t('reports.import.toast.emptyFile.title'), description: t('reports.import.toast.emptyFile.description') });
          setIsLoadingFile(false);
          return;
        }

        const headerRow = jsonData[0].map(h => String(h).trim());
        const dataRows = jsonData.slice(1);

        const missingHeaders = REQUIRED_HEADERS_LT.filter(h => !headerRow.includes(h));
        if (missingHeaders.length > 0) {
          toast({ variant: "destructive", title: t('reports.import.toast.missingHeaders.title'), description: t('reports.import.toast.missingHeaders.description', { headers: missingHeaders.join(', ') }) });
          setIsLoadingFile(false);
          return;
        }

        const nameIndex = headerRow.indexOf(REQUIRED_HEADERS_LT[0]);
        const commentIndex = headerRow.indexOf(REQUIRED_HEADERS_LT[1]);
        const dateIndex = headerRow.indexOf(REQUIRED_HEADERS_LT[2]);

        const initialParsedData = dataRows.map((row, index) => ({
          id: index,
          fullName: String(row[nameIndex] || ''),
          comment: String(row[commentIndex] || ''),
          date: String(row[dateIndex] || ''),
          status: 'pending' as RowStatus,
        })).filter(row => row.fullName && row.comment);

        setParsedData(initialParsedData);
        setIsLoadingFile(false);
        
        startAiTransition(async () => {
          for (let i = 0; i < initialParsedData.length; i++) {
            const row = initialParsedData[i];
            setParsedData(prev => prev.map(p => p.id === row.id ? { ...p, status: 'processing' } : p));
            try {
              if (!row.comment) {
                throw new Error("Komentaras tuščias.");
              }
              const result = await categorizeReport({ comment: row.comment });
              setParsedData(prev => prev.map(p => p.id === row.id ? { ...p, status: 'completed', aiCategory: result.categoryId, aiTags: result.suggestedTags } : p));
            } catch (error) {
              console.error(`Error processing row ${row.id}:`, error);
              setParsedData(prev => prev.map(p => p.id === row.id ? { ...p, status: 'ai-error', errorMessage: (error as Error).message } : p));
            }
            setProgress(((i + 1) / initialParsedData.length) * 100);
          }
        });

      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: t('reports.import.toast.parseError.title'), description: (err as Error).message });
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file, t, toast]);

  const handleImportData = async () => {
    if (!user) return;
    const validRows = parsedData.filter(row => row.status === 'completed');
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: t('reports.import.toast.noDataToImport.title'), description: t('reports.import.toast.noDataToImport.description') });
      return;
    }

    setIsImporting(true);
    try {
      const reportsToAdd: Omit<Report, 'id'|'deletedAt'|'createdAt'>[] = validRows.map(row => ({
        reporterId: user.id,
        reporterCompanyName: user.companyName,
        fullName: row.fullName,
        comment: row.comment,
        category: row.aiCategory!,
        tags: row.aiTags!,
        // Note: The date from Excel is used to set the creation time,
        // but it will be converted to a Firestore Timestamp in the storage function.
        // We pass the string for now.
      }));
      
      for(const reportData of reportsToAdd) {
         // Create a temporary object with a proper Timestamp for the storage function
        const reportForStorage = {
            ...reportData,
            createdAt: Timestamp.fromDate(new Date(validRows.find(vr => vr.fullName === reportData.fullName && vr.comment === reportData.comment)!.date))
        };
        await storage.addReport(reportForStorage);
      }

      toast({
        title: t('reports.import.toast.importSuccess.title'),
        description: t('reports.import.toast.importSuccess.description', { count: reportsToAdd.length }),
      });
      router.push('/reports/history');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: t('reports.import.toast.importError.title'), description: (err as Error).message });
    } finally {
      setIsImporting(false);
    }
  };

  const completedCount = useMemo(() => parsedData.filter(r => r.status === 'completed').length, [parsedData]);
  
  const renderStatusIcon = (status: RowStatus, message?: string) => {
    switch(status) {
      case 'pending': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.pending')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'processing': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Wand2 className="h-4 w-4 text-blue-500 animate-pulse" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.processing')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'completed': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Check className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.completed')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'ai-error': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><AlertCircleIcon className="h-4 w-4 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.aiError')}: {message}</p></TooltipContent></Tooltip></TooltipProvider>;
      default: return null;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FileUp className="mr-3 h-7 w-7 text-primary" />
            {t('reports.import.title')}
          </CardTitle>
          <CardDescription>
            {t('reports.import.description')}
            <br />
            {t('reports.import.expectedHeaders', { headers: REQUIRED_HEADERS_LT.join('", "') })}
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
              disabled={isLoadingFile || isAiProcessing}
            />
            <Button onClick={handleParseAndCategorize} disabled={!file || isLoadingFile || isAiProcessing || isImporting} className="w-full sm:w-auto">
              {isLoadingFile || isAiProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isLoadingFile ? t('usersImport.button.parsing') : isAiProcessing ? "AI Apdoroja..." : "Analizuoti ir Apdoroti"}
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground">{t('reports.import.selectedFile')}: {fileName}</p>}
          
          {isAiProcessing && <Progress value={progress} className="w-full" />}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('reports.import.previewTitle')} ({parsedData.length} {t('reports.import.recordsFound')})</h3>
              <div className="max-h-[500px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 z-10">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">{t('reports.import.table.status')}</TableHead>
                      <TableHead>{t('reports.import.table.fullName')}</TableHead>
                      <TableHead>{t('reports.import.table.comment')}</TableHead>
                      <TableHead>{t('reports.import.table.date')}</TableHead>
                      <TableHead>{t('reports.import.table.categoryAI')}</TableHead>
                      <TableHead>{t('reports.import.table.tagsAI')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center">{renderStatusIcon(row.status, row.errorMessage)}</TableCell>
                        <TableCell>{row.fullName}</TableCell>
                        <TableCell className="text-xs max-w-xs whitespace-pre-wrap">{row.comment}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>
                            {row.aiCategory && <Badge variant="secondary">{getCategoryNameForDisplay(row.aiCategory, t)}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.aiTags?.map(tag => <Badge key={tag} variant="outline">{t('tags.' + tag)}</Badge>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        </CardContent>
        {parsedData.length > 0 && (
          <CardFooter className="border-t pt-6">
            <Button
              onClick={handleImportData}
              disabled={isImporting || isLoadingFile || isAiProcessing || completedCount === 0}
              className="w-full sm:w-auto ml-auto"
            >
              {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              {isImporting ? t('reports.import.button.importing') : t('reports.import.button.importAll', { count: completedCount })}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
