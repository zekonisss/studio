
"use client";

import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Ban } from "lucide-react"; // Added Ban for skipped
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Report } from '@/types';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { getReportsFromLocalStoragePublic, saveReportsToLocalStoragePublic, detailedReportCategories } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ParsedRow {
  originalRow: Record<string, any>;
  reportPreview: Partial<Report>;
  aiStatus: 'pending' | 'processing' | 'completed' | 'error' | 'skipped_quota';
  aiResult?: { categoryId: string; suggestedTags: string[] };
  error?: string;
}

const AI_CALL_DELAY_MS = 4500;
const MAX_AI_ATTEMPTS_PER_ROW = 2;
const AI_RETRY_DELAY_MS = 7000;

export default function ImportReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setParsedData([]);
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

  const parseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'number') {
      try {
        return XLSX.SSF.parse_date_code(dateValue) ? new Date(XLSX.SSF.format('yyyy-mm-dd', dateValue)) : undefined;
      } catch {
        return undefined;
      }
    }
    if (typeof dateValue === 'string') {
      const dateStr = dateValue.replace(/\./g, '-');
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  };

  const handleParseFile = async () => {
    if (!file || !user) return;
    setIsLoadingFile(true);
    setParsedData([]);

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
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false, defval: null });

        if (jsonData.length === 0) {
          toast({ variant: "destructive", title: t('reports.import.toast.emptyFile.title'), description: t('reports.import.toast.emptyFile.description') });
          setIsLoadingFile(false);
          return;
        }

        const expectedHeaders = ['Title', 'Company', 'Comment1', 'Comment2'];
        const actualHeaders = Object.keys(jsonData[0] || {});
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
            toast({
                variant: "destructive",
                title: t('reports.import.toast.missingHeaders.title'),
                description: t('reports.import.toast.missingHeaders.description', { headers: missingHeaders.join(', ') }),
                duration: 7000,
            });
            setIsLoadingFile(false);
            return;
        }

        const previews: ParsedRow[] = jsonData.map((row, index) => {
          const createdAtDate = parseDate(row.Comment2);
          let commentText = String(row.Comment1 || '');
          if (row.Company) {
            commentText += `\n${t('reports.import.associatedCompanyPrefix')}: ${row.Company}`;
          }

          return {
            originalRow: row,
            reportPreview: {
              id: `import-${Date.now()}-${index}`,
              reporterId: user.id,
              reporterCompanyName: user.companyName,
              fullName: String(row.Title || t('reports.import.unknownDriver')),
              comment: commentText,
              createdAt: createdAtDate || new Date(),
              category: 'other_category',
              tags: [],
            },
            aiStatus: 'pending',
          };
        });
        setParsedData(previews);
        await processWithAI(previews);
      } catch (error: any) {
        toast({ variant: "destructive", title: t('reports.import.toast.parseError.title'), description: error.message || t('reports.import.toast.parseError.description') });
      } finally {
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processWithAI = async (rowsToProcess: ParsedRow[]) => {
    setIsProcessingAi(true);
    const updatedRows = [...rowsToProcess];
    let dailyQuotaHitInThisBatch = false;

    for (let i = 0; i < updatedRows.length; i++) {
      let row = updatedRows[i];

      if (dailyQuotaHitInThisBatch) {
        updatedRows[i] = {
          ...row,
          aiStatus: 'skipped_quota',
          reportPreview: {
            ...row.reportPreview,
            category: 'other_category',
            tags: [],
          },
        };
        setParsedData([...updatedRows]); // Update UI for skipped row
        continue;
      }

      if (!row.reportPreview.comment || row.reportPreview.comment.trim() === "") {
        row.aiStatus = 'completed';
        row.aiResult = { categoryId: 'other_category', suggestedTags: [] };
        row.reportPreview.category = 'other_category';
        row.reportPreview.tags = [];
        updatedRows[i] = row;
        setParsedData([...updatedRows]);
        if (i < updatedRows.length - 1) {
          await new Promise(resolve => setTimeout(resolve, AI_CALL_DELAY_MS));
        }
        continue;
      }

      updatedRows[i] = { ...row, aiStatus: 'processing' };
      setParsedData([...updatedRows]);

      let attemptSuccess = false;
      for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS_PER_ROW; attempt++) {
        try {
          const aiResult = await categorizeReport({ comment: row.reportPreview.comment! });
          updatedRows[i] = {
            ...updatedRows[i],
            aiStatus: 'completed',
            aiResult: aiResult,
            reportPreview: {
              ...updatedRows[i].reportPreview,
              category: aiResult.categoryId,
              tags: aiResult.suggestedTags,
            },
          };
          attemptSuccess = true;
          break;
        } catch (error: any) {
          const errorMessageString = String(error.message || '');
          const isServiceUnavailable = errorMessageString.includes('[503 Service Unavailable]');
          const isDailyQuotaError = errorMessageString.includes('[429 Too Many Requests]') &&
                                   (errorMessageString.includes('exceeded your current quota') || errorMessageString.includes('PerDay') || errorMessageString.includes('GenerateRequestsPerDayPerProjectPerModel-FreeTier'));

          if (isDailyQuotaError) {
            console.error(`Daily AI quota limit reached at row ${i}, attempt ${attempt}. Error:`, error);
            if (!dailyQuotaHitInThisBatch) {
              toast({
                variant: "destructive",
                title: t('reports.import.toast.dailyQuotaReached.title'),
                description: t('reports.import.toast.dailyQuotaReached.description'),
                duration: 10000,
              });
            }
            dailyQuotaHitInThisBatch = true;
            updatedRows[i] = {
              ...updatedRows[i],
              aiStatus: 'error',
              error: t('reports.import.error.aiDailyQuotaExceededFull', { message: errorMessageString }),
            };
            break;
          } else if (attempt < MAX_AI_ATTEMPTS_PER_ROW && isServiceUnavailable) {
            console.warn(`AI service unavailable for row ${i}, attempt ${attempt}/${MAX_AI_ATTEMPTS_PER_ROW}. Retrying in ${AI_RETRY_DELAY_MS / 1000}s... Details:`, errorMessageString);
            await new Promise(resolve => setTimeout(resolve, AI_RETRY_DELAY_MS));
          } else {
            // This block is reached on the last attempt for a 503, or for any other non-daily-quota error.
            const specificErrorMsg = isServiceUnavailable ?
                                     `${t('reports.import.error.aiServiceOverloadedMaxAttempts', { attempts: MAX_AI_ATTEMPTS_PER_ROW })}` :
                                     `${t('reports.import.error.aiGenericErrorAttempt', { attempt, maxAttempts: MAX_AI_ATTEMPTS_PER_ROW, message: errorMessageString })}`;

            if (isServiceUnavailable) {
                 console.warn(`AI service still unavailable for row ${i} after ${attempt} attempts. Error:`, error);
            } else {
                 console.error(`AI processing error for row ${i} (Attempt ${attempt}/${MAX_AI_ATTEMPTS_PER_ROW}). Error:`, error);
            }

            updatedRows[i] = {
              ...updatedRows[i],
              aiStatus: 'error',
              error: specificErrorMsg,
            };
            break;
          }
        }
      }

      setParsedData([...updatedRows]);

      if (i < updatedRows.length - 1 && !dailyQuotaHitInThisBatch) {
        await new Promise(resolve => setTimeout(resolve, AI_CALL_DELAY_MS));
      }
    }
    setParsedData([...updatedRows]);
    setIsProcessingAi(false);
  };

  const handleImportData = async () => {
    if (parsedData.some(row => row.aiStatus === 'processing')) {
      toast({ variant: "destructive", title: t('reports.import.toast.waitAi.title'), description: t('reports.import.toast.waitAi.description') });
      return;
    }

    setIsImporting(true);
    const reportsToImport: Report[] = parsedData
      .filter(row => (row.aiStatus === 'completed' || row.aiStatus === 'skipped_quota') && row.reportPreview)
      .map(row => row.reportPreview as Report);

    if (reportsToImport.length === 0) {
      toast({ variant: "destructive", title: t('reports.import.toast.noDataToImport.title'), description: t('reports.import.toast.noDataToImport.description') });
      setIsImporting(false);
      return;
    }

    try {
      const existingReports = getReportsFromLocalStoragePublic();
      const combinedReports = [...existingReports, ...reportsToImport];
      saveReportsToLocalStoragePublic(combinedReports);

      toast({
        title: t('reports.import.toast.importSuccess.title'),
        description: t('reports.import.toast.importSuccess.description', { count: reportsToImport.length }),
      });
      setParsedData([]);
      setFile(null);
      setFileName(null);
      const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error: any) {
      toast({ variant: "destructive", title: t('reports.import.toast.importError.title'), description: error.message || t('reports.import.toast.importError.description') });
    } finally {
      setIsImporting(false);
    }
  };

  const getCategoryNameDisplay = (categoryId: string) => {
    const category = detailedReportCategories.find(c => c.id === categoryId);
    return category ? t(category.nameKey) : categoryId;
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
            <br />
            {t('reports.import.expectedHeaders', { headers: "Title, Company, Comment1, Comment2" })}
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
              disabled={isLoadingFile || isProcessingAi}
            />
            <Button onClick={handleParseFile} disabled={!file || isLoadingFile || isProcessingAi} className="w-full sm:w-auto">
              {isLoadingFile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isLoadingFile ? t('reports.import.button.parsing') : t('reports.import.button.parseFile')}
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground">{t('reports.import.selectedFile')}: {fileName}</p>}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('reports.import.previewTitle')} ({parsedData.length} {t('reports.import.recordsFound')})</h3>
              <div className="max-h-[500px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.import.table.fullName')}</TableHead>
                      <TableHead>{t('reports.import.table.comment')}</TableHead>
                      <TableHead>{t('reports.import.table.date')}</TableHead>
                      <TableHead>{t('reports.import.table.categoryAI')}</TableHead>
                      <TableHead>{t('reports.import.table.tagsAI')}</TableHead>
                      <TableHead>{t('reports.import.table.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={row.reportPreview.id || index}>
                        <TableCell className="font-medium">{row.reportPreview.fullName}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{row.reportPreview.comment}</TableCell>
                        <TableCell>{row.reportPreview.createdAt ? new Date(row.reportPreview.createdAt).toLocaleDateString(locale) : '-'}</TableCell>
                        <TableCell>
                          {row.aiStatus === 'completed' && row.aiResult?.categoryId ? getCategoryNameDisplay(row.aiResult.categoryId) :
                           row.aiStatus === 'skipped_quota' ? getCategoryNameDisplay(row.reportPreview.category!) :
                           row.aiStatus === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                           (row.aiStatus === 'error' ? <span className="text-destructive text-xs">{t('reports.import.status.aiError')}</span> : '-')}
                        </TableCell>
                        <TableCell>
                           {row.aiStatus === 'completed' && row.aiResult?.suggestedTags && row.aiResult.suggestedTags.length > 0 ?
                            row.aiResult.suggestedTags.map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1 text-xs">{t(`tags.${tag.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_')}`)}</Badge>) :
                            row.aiStatus === 'skipped_quota' ? <span className="text-xs text-muted-foreground">-</span> :
                            row.aiStatus === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                            (row.aiStatus === 'completed' && row.aiResult?.suggestedTags.length === 0 ? <span className="text-xs text-muted-foreground">-</span> :
                            (row.aiStatus === 'error' ? <span className="text-destructive text-xs">{t('reports.import.status.aiError')}</span> : '-'))}
                        </TableCell>
                        <TableCell>
                          {row.aiStatus === 'pending' && <span className="text-muted-foreground text-xs">{t('reports.import.status.pending')}</span>}
                          {row.aiStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                          {row.aiStatus === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {row.aiStatus === 'error' &&
                            <div className="flex items-center text-destructive text-xs" title={row.error}>
                                <AlertTriangle className="h-4 w-4 mr-1" /> {t('reports.import.status.error')}
                            </div>
                          }
                          {row.aiStatus === 'skipped_quota' &&
                            <div className="flex items-center text-orange-500 text-xs" title={t('reports.import.status.skippedQuotaTooltip')}>
                                <Ban className="h-4 w-4 mr-1" /> {t('reports.import.status.skippedQuota')}
                            </div>
                          }
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
          <CardFooter>
            <Button onClick={handleImportData} disabled={isImporting || isProcessingAi || parsedData.some(r => r.aiStatus === 'processing')} className="w-full sm:w-auto ml-auto">
              {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              {isImporting ? t('reports.import.button.importing') : t('reports.import.button.importAll', { count: parsedData.filter(r => r.aiStatus === 'completed' || r.aiStatus === 'skipped_quota').length })}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
