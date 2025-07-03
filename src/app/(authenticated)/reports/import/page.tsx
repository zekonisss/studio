
"use client";

import { useState, ChangeEvent, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Bot, AlertCircleIcon, Hourglass, Check, CircleSlash } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Report, DetailedCategory } from '@/types';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { detailedReportCategories } from '@/types';
import { getAllReports, saveAllReports } from '@/lib/storage';
import { useRouter } from "next/navigation";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ParsedRow {
  id: number; // Unique ID for React key
  originalRow: Record<string, any>;
  reportPreview: Partial<Report>;
  aiStatus: 'pending' | 'processing' | 'completed' | 'error' | 'skipped_quota';
  aiResult?: { categoryId: string; suggestedTags: string[] };
  error?: string;
}

const AI_REQUEST_DELAY_MS = 1500; // Delay between AI requests

export default function ImportReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dailyQuotaReachedAi, setDailyQuotaReachedAi] = useState(false);

  // Expected headers in Lithuanian (primary language for mapping)
  const REQUIRED_HEADERS_LT = ["Vardas Pavardė", "Komentaras"];
  const OPTIONAL_HEADERS_LT = ["Data", "Pilietybė", "Gimimo Metai"];
  // English equivalents for display in UI if needed, or for looser matching
  const HEADER_MAPPINGS: Record<string, string> = {
      "Vardas Pavardė": "fullName",
      "Full Name": "fullName",
      "Komentaras": "comment",
      "Comment": "comment",
      "Data": "createdAt", // Will be parsed to Date
      "Date": "createdAt",
      "Pilietybė": "nationality",
      "Nationality": "nationality",
      "Gimimo Metai": "birthYear", // Will be parsed to Number
      "Birth Year": "birthYear",
      "Year of Birth": "birthYear",
  };
  
  const getCategoryNameImport = (categoryId: string) => {
    const category = detailedReportCategories.find(c => c.id === categoryId);
    return category ? t(category.nameKey) : categoryId;
  };


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


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setParsedData([]);
        setDailyQuotaReachedAi(false); // Reset quota flag on new file
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

  const findHeader = (headerRow: any[], targetHeaderLT: string): string | undefined => {
    const lowerTargetHeaderLT = targetHeaderLT.toLowerCase();
    return headerRow.find(header => 
      (typeof header === 'string' && header.toLowerCase() === lowerTargetHeaderLT) ||
      (HEADER_MAPPINGS[header as string]?.toLowerCase() === HEADER_MAPPINGS[targetHeaderLT]?.toLowerCase())
    );
  };

  const handleParseFile = async () => {
    if (!file || !user) return;
    setIsLoadingFile(true);
    setParsedData([]);
    setDailyQuotaReachedAi(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
            throw new Error(t('reports.import.error.fileReadError'));
        }
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
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

        const foundRequiredHeaders = REQUIRED_HEADERS_LT.map(requiredHeaderLT => findHeader(headerRow, requiredHeaderLT));
        const missingRequiredHeaders = REQUIRED_HEADERS_LT.filter((_, index) => !foundRequiredHeaders[index]);

        if (missingRequiredHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: t('reports.import.toast.missingHeaders.title'),
            description: t('reports.import.toast.missingHeaders.description', { headers: missingRequiredHeaders.join(', ') }),
            duration: 7000,
          });
          setIsLoadingFile(false);
          return;
        }
        
        const mappedHeaders: Record<string, number> = {};
        headerRow.forEach((header, index) => {
            const cleanHeader = String(header).trim();
            for (const [excelHeader, internalKey] of Object.entries(HEADER_MAPPINGS)) {
                if (cleanHeader.toLowerCase() === excelHeader.toLowerCase()) {
                    mappedHeaders[internalKey] = index;
                    break;
                }
            }
            // Fallback if no mapping, use original header if it's one of the primary ones
            if (!Object.values(mappedHeaders).includes(index)) {
                 if (REQUIRED_HEADERS_LT.map(h => h.toLowerCase()).includes(cleanHeader.toLowerCase())) {
                     mappedHeaders[HEADER_MAPPINGS[REQUIRED_HEADERS_LT.find(h_lt => h_lt.toLowerCase() === cleanHeader.toLowerCase())!]] = index;
                 } else if (OPTIONAL_HEADERS_LT.map(h => h.toLowerCase()).includes(cleanHeader.toLowerCase())) {
                     mappedHeaders[HEADER_MAPPINGS[OPTIONAL_HEADERS_LT.find(h_lt => h_lt.toLowerCase() === cleanHeader.toLowerCase())!]] = index;
                 }
            }
        });


        const newParsedData: ParsedRow[] = dataRows.map((row, index) => {
          const originalRow: Record<string, any> = {};
          headerRow.forEach((header, i) => {
            originalRow[String(header).trim()] = row[i];
          });
          
          const fullName = row[mappedHeaders.fullName] ? String(row[mappedHeaders.fullName]).trim() : t('reports.import.unknownDriver');
          const comment = row[mappedHeaders.comment] ? String(row[mappedHeaders.comment]).trim() : "";
          
          let createdAt: Date | undefined;
          if (mappedHeaders.createdAt !== undefined && row[mappedHeaders.createdAt]) {
            const dateValue = row[mappedHeaders.createdAt];
            if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
              createdAt = dateValue;
            } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
              const parsedDate = new Date(dateValue);
              if (!isNaN(parsedDate.getTime())) createdAt = parsedDate;
            }
          }

          let birthYear: number | undefined;
          if (mappedHeaders.birthYear !== undefined && row[mappedHeaders.birthYear]) {
            const rawBirthYear = row[mappedHeaders.birthYear];
            const parsedNum = Number(rawBirthYear);
            if (!isNaN(parsedNum) && parsedNum > 1900 && parsedNum <= new Date().getFullYear()) {
              birthYear = parsedNum;
            }
          }
          
          const nationality = mappedHeaders.nationality !== undefined && row[mappedHeaders.nationality] ? String(row[mappedHeaders.nationality]).trim() : undefined;

          const aiStatus: ParsedRow['aiStatus'] = comment ? 'pending' : 'skipped_quota';

          return {
            id: index,
            originalRow,
            reportPreview: {
              fullName,
              comment,
              createdAt,
              nationality,
              birthYear,
              reporterId: user.id,
              reporterCompanyName: user.companyName,
            },
            aiStatus,
            aiResult: undefined,
            error: comment ? undefined : t('reports.import.error.noCommentForAi'),
          };
        }).filter(row => row.reportPreview.fullName !== t('reports.import.unknownDriver') || row.reportPreview.comment); // Filter out completely empty/useless rows

        setParsedData(newParsedData);
        if (newParsedData.length > 0) {
            startAiProcessing(newParsedData);
        }

      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: t('reports.import.toast.parseError.title'), description: (err as Error).message || t('reports.import.toast.parseError.description') });
      } finally {
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const startAiProcessing = async (dataToProcess: ParsedRow[]) => {
    setIsProcessingAi(true);
    let currentQuotaReached = false;

    for (let i = 0; i < dataToProcess.length; i++) {
      if (currentQuotaReached || dataToProcess[i].aiStatus === 'skipped_quota') {
        setParsedData(prev => prev.map(row => row.id === dataToProcess[i].id ? { ...row, aiStatus: 'skipped_quota', error: t('reports.import.status.skippedQuotaTooltip') } : row));
        continue;
      }

      if (!dataToProcess[i].reportPreview.comment) {
        setParsedData(prev => prev.map(row => row.id === dataToProcess[i].id ? { ...row, aiStatus: 'error', error: t('reports.import.error.noCommentForAi') } : row));
        continue;
      }
      
      setParsedData(prev => prev.map(row => row.id === dataToProcess[i].id ? { ...row, aiStatus: 'processing' } : row));
      
      try {
        const result = await categorizeReport({ comment: dataToProcess[i].reportPreview.comment! });
        setParsedData(prev => prev.map(row => row.id === dataToProcess[i].id ? { ...row, aiStatus: 'completed', aiResult: result } : row));
      } catch (err: any) {
        let errorMessage = t('reports.import.error.aiGenericError');
        if (err.message && typeof err.message === 'string') {
          if (err.message.includes('429') && (err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('free tier'))) {
            errorMessage = t('reports.import.toast.dailyQuotaReached.descriptionShort');
            currentQuotaReached = true;
            setDailyQuotaReachedAi(true);
            toast({
              variant: "destructive",
              title: t('reports.import.toast.dailyQuotaReached.title'),
              description: t('reports.import.toast.dailyQuotaReached.description'),
              duration: 10000,
            });
          } else if (err.message.includes('429')) {
            errorMessage = t('reports.import.error.aiServiceOverloaded');
          } else if (err.message.length < 100) {
            errorMessage = err.message;
          }
        }
        console.error("AI Processing Error for row", dataToProcess[i].id, ":", err);
        setParsedData(prev => prev.map(row => row.id === dataToProcess[i].id ? { ...row, aiStatus: 'error', error: errorMessage } : row));
      }
      if (i < dataToProcess.length -1 && !currentQuotaReached) { // Don't delay if it's the last item or quota hit
        await new Promise(resolve => setTimeout(resolve, AI_REQUEST_DELAY_MS));
      }
    }
    setIsProcessingAi(false);
  };

  const handleImportData = async () => {
    if (!user) return;
    const completedRows = parsedData.filter(row => row.aiStatus === 'completed' && row.aiResult);
    if (completedRows.length === 0) {
      toast({ variant: "destructive", title: t('reports.import.toast.noDataToImport.title'), description: t('reports.import.toast.noDataToImport.description') });
      return;
    }

    setIsImporting(true);
    try {
      const existingReports = getAllReports();
      const newReports: Report[] = completedRows.map(row => ({
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${row.id}`,
        reporterId: user.id,
        reporterCompanyName: user.companyName,
        fullName: row.reportPreview.fullName!,
        nationality: row.reportPreview.nationality,
        birthYear: row.reportPreview.birthYear,
        category: row.aiResult!.categoryId,
        tags: row.aiResult!.suggestedTags,
        comment: row.reportPreview.comment!,
        imageUrl: row.reportPreview.imageUrl, // Could be mapped from Excel if a column exists
        dataAiHint: row.reportPreview.dataAiHint,
        createdAt: row.reportPreview.createdAt || new Date(),
      }));

      saveAllReports([...existingReports, ...newReports]);
      toast({
        title: t('reports.import.toast.importSuccess.title'),
        description: t('reports.import.toast.importSuccess.description', { count: newReports.length }),
      });
      setParsedData([]);
      setFile(null);
      setFileName(null);
      setDailyQuotaReachedAi(false);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: t('reports.import.toast.importError.title'), description: (err as Error).message || t('reports.import.toast.importError.description') });
    } finally {
      setIsImporting(false);
    }
  };
  
  const completedCount = useMemo(() => parsedData.filter(r => r.aiStatus === 'completed').length, [parsedData]);


  if (authLoading || (!user || !user.isAdmin)) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderStatusIcon = (status: ParsedRow['aiStatus']) => {
    switch (status) {
      case 'pending': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Hourglass className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.pending')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'processing': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.processing')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'completed': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Check className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.completed')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'error': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><AlertCircleIcon className="h-4 w-4 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.aiError')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'skipped_quota': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><CircleSlash className="h-4 w-4 text-orange-500" /></Button></TooltipTrigger><TooltipContent><p>{t('reports.import.status.skippedQuotaTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>;
      default: return null;
    }
  };

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
            {t('reports.import.expectedHeaders', { headers: REQUIRED_HEADERS_LT.join('", "') + '". ' + t('reports.import.optionalHeaders') + ': "' + OPTIONAL_HEADERS_LT.join('", "') })}
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
              disabled={isLoadingFile || isProcessingAi || isImporting}
            />
            <Button onClick={handleParseFile} disabled={!file || isLoadingFile || isProcessingAi || isImporting} className="w-full sm:w-auto">
              {isLoadingFile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isLoadingFile ? t('reports.import.button.parsing') : t('reports.import.button.parseFile')}
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground">{t('reports.import.selectedFile')}: {fileName}</p>}
          
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('reports.import.previewTitle')} ({parsedData.length} {t('reports.import.recordsFound')})</h3>
              {isProcessingAi && <p className="text-sm text-blue-600 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t('reports.import.aiProcessingMessage')}</p>}
              {dailyQuotaReachedAi && <p className="text-sm text-orange-600 flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/>{t('reports.import.dailyQuotaReachedMessage')}</p>}

              <div className="max-h-[500px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 z-10">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">{t('reports.import.table.status')}</TableHead>
                      <TableHead>{t('reports.import.table.fullName')}</TableHead>
                      <TableHead className="min-w-[250px]">{t('reports.import.table.comment')}</TableHead>
                      <TableHead>{t('reports.import.table.categoryAI')}</TableHead>
                      <TableHead>{t('reports.import.table.tagsAI')}</TableHead>
                      <TableHead className="w-[150px]">{t('reports.import.table.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.id} className={row.aiStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20' : row.aiStatus === 'skipped_quota' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                        <TableCell className="text-center align-top pt-3">{renderStatusIcon(row.aiStatus)}</TableCell>
                        <TableCell className="align-top pt-3">{row.reportPreview.fullName}</TableCell>
                        <TableCell className="align-top pt-3 text-xs max-w-md whitespace-pre-wrap">{row.reportPreview.comment?.substring(0,150)}{row.reportPreview.comment && row.reportPreview.comment.length > 150 ? '...' : ''}
                          {row.error && <p className="text-red-600 text-xs mt-1">{row.error}</p>}
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          {row.aiResult?.categoryId ? getCategoryNameImport(row.aiResult.categoryId) : '-'}
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          {row.aiResult?.suggestedTags && row.aiResult.suggestedTags.length > 0 
                            ? row.aiResult.suggestedTags.map(tagKey => <Badge key={tagKey} variant="outline" className="mr-1 mb-1 text-xs">{t('tags.'+tagKey)}</Badge>)
                            : '-'}
                        </TableCell>
                        <TableCell className="align-top pt-3 text-xs">
                          {row.reportPreview.createdAt ? new Date(row.reportPreview.createdAt).toLocaleDateString(t('common.localeForDate', {lng: 'lt'})) : t('common.notSpecified')}
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
              disabled={isImporting || isProcessingAi || isLoadingFile || completedCount === 0} 
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

