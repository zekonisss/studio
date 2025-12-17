"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, BrainCircuit, Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileX2, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categorizeReport } from "@/ai/flows/categorize-report-flow";
import { addReport } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";
import { getCategoryNameForDisplay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseExcelFile, type ParsedRecord } from "./actions";


type RecordStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped_quota';
export type ClientParsedRecord = ParsedRecord & {
  status: RecordStatus;
  aiCategory?: string;
  aiTags?: string[];
  error?: string;
};


export default function ReportsImportPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ClientParsedRecord[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const isCancelledRef = useRef(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
        setFile(selectedFile);
        setRecords([]);
      } else {
        toast({
          variant: "destructive",
          title: t('reports.import.toast.invalidFileType.title'),
          description: t('reports.import.toast.invalidFileType.description'),
        });
      }
    }
  };
  
  const handleFileParse = async () => {
    if (!file) return;

    setIsParsing(true);
    isCancelledRef.current = false;

    try {
        const fileBuffer = await file.arrayBuffer();
        const result = await parseExcelFile(fileBuffer);

        if (result.error) {
            toast({ variant: "destructive", title: result.error.title, description: result.error.description });
            setIsParsing(false);
            return;
        }

        const clientRecords: ClientParsedRecord[] = result.data!.map(rec => ({ ...rec, status: 'pending' }));

        if (clientRecords.length === 0) {
            toast({ variant: "destructive", title: t('reports.import.toast.emptyFile.title'), description: t('reports.import.toast.emptyFile.description') });
            setIsParsing(false);
            return;
        }

        setRecords(clientRecords);
        await processRecordsWithAI(clientRecords);

    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: t('reports.import.toast.parseError.title'), description: error.message || t('reports.import.toast.parseError.description') });
    } finally {
        setIsParsing(false);
    }
  };
  
  const processRecordsWithAI = async (recordsToProcess: ClientParsedRecord[]) => {
      let dailyQuotaReached = false;

      for (const record of recordsToProcess) {
          if (isCancelledRef.current) {
            console.log("AI analysis cancelled by user.");
            break; 
          }
          if (dailyQuotaReached) {
              updateRecordStatus(record.id, { status: 'skipped_quota' });
              continue;
          }
          if (!record.comment) {
              updateRecordStatus(record.id, { status: 'error', error: t('reports.import.error.noCommentForAi')});
              continue;
          }

          updateRecordStatus(record.id, { status: 'processing' });
          try {
              const result = await categorizeReport({ comment: record.comment });
              updateRecordStatus(record.id, {
                  status: 'completed',
                  aiCategory: result.categoryId,
                  aiTags: result.suggestedTags,
              });
          } catch (error: any) {
              console.error(`AI error for record ${record.id}:`, error);

              if (error.message && error.message.includes('AI_QUOTA_EXCEEDED')) {
                  dailyQuotaReached = true;
                  toast({ variant: "destructive", title: t('reports.import.toast.dailyQuotaReached.title'), description: t('reports.import.toast.dailyQuotaReached.descriptionShort') });
                  updateRecordStatus(record.id, { status: 'skipped_quota' });
                  continue;
              }

              const errorMessage = error.message || t('reports.import.error.aiGenericError');
              updateRecordStatus(record.id, { 
                  status: 'error',
                  error: errorMessage,
                  aiCategory: 'other_category',
                  aiTags: []
              });
          }
      }
  };

  const updateRecordStatus = (id: number, updates: Partial<ClientParsedRecord>) => {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  
  const handleImportAll = async () => {
    if (!user) {
        toast({ variant: "destructive", title: t('toast.login.error.title'), description: t('toast.login.error.accessDenied') });
        return;
    }

    const recordsToImport = records.filter(r => r.status === 'completed' || r.status === 'error' || r.status === 'skipped_quota');
    if (recordsToImport.length === 0) {
        toast({ variant: "destructive", title: t('reports.import.toast.noDataToImport.title'), description: t('reports.import.toast.noDataToImport.description') });
        return;
    }
    
    setIsImporting(true);
    try {
        const importPromises = recordsToImport.map(rec => {
            const reportData = {
                reporterId: user.id,
                reporterCompanyName: user.companyName,
                fullName: rec.fullName,
                category: rec.aiCategory || 'other_category',
                tags: rec.aiTags || [],
                comment: rec.comment,
                createdAt: new Date(rec.createdAt)
            };
            return addReport(reportData);
        });

        await Promise.all(importPromises);

        toast({ title: t('reports.import.toast.importSuccess.title'), description: t('reports.import.toast.importSuccess.description', { count: recordsToImport.length }) });
        setFile(null);
        setRecords([]);

    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: t('reports.import.toast.importError.title'), description: t('reports.import.toast.importError.description') });
    } finally {
        setIsImporting(false);
    }
  };
  
  const handleCancel = () => {
    isCancelledRef.current = true;
    setRecords(prev => prev.map(r => r.status === 'processing' || r.status === 'pending' ? { ...r, status: 'error', error: 'Cancelled by user' } : r));
  };
  
  const StatusIndicator = ({ status, error }: { status: ClientParsedRecord['status'], error?: string }) => {
      switch (status) {
          case 'pending': return <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t('reports.import.status.pending')}</span>
          case 'processing': return <span className="flex items-center gap-2 text-blue-500"><BrainCircuit className="h-4 w-4 animate-spin" />{t('reports.import.status.processing')}</span>
          case 'completed': return <span className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" />{t('reports.import.status.completed')}</span>
          case 'error': 
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center gap-2 text-destructive cursor-pointer">
                      <AlertTriangle className="h-4 w-4" />
                      {t('reports.import.status.aiError')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{error}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          case 'skipped_quota':
              return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center gap-2 text-amber-600 cursor-pointer">
                      <Info className="h-4 w-4" />
                      {t('reports.import.status.skippedQuota')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t('reports.import.status.skippedQuotaTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          default: return null;
      }
  }

  if (!user?.isAdmin) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Prieiga negalima</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Šis puslapis prieinamas tik administratoriams.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>{t('reports.import.title')}</CardTitle>
            <CardDescription>
                {t('reports.import.description')} Privalomi stulpeliai: <strong>&quot;Title&quot;</strong> ir <strong>&quot;Comment&quot;</strong>. Papildomi stulpeliai: <strong>&quot;Company&quot;</strong>, <strong>&quot;Date&quot;</strong>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-auto flex-grow">
                <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isParsing || isImporting} />
                {file && <p className="text-sm text-muted-foreground mt-2">{t('reports.import.selectedFile')}: {file.name}</p>}
            </div>
            <Button onClick={handleFileParse} disabled={!file || isParsing || isImporting} className="w-full sm:w-auto">
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {isParsing ? t('reports.import.button.parsing') : t('reports.import.button.parseFile')}
            </Button>
            {isParsing && (
              <Button onClick={handleCancel} variant="destructive" className="w-full sm:w-auto">
                  <XCircle className="mr-2 h-4 w-4" />
                  Stabdyti analizę
              </Button>
            )}
        </div>

        {records.length > 0 && (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('reports.import.previewTitle')} ({records.length} {t('reports.import.recordsFound')})</h3>
                     <Button onClick={handleImportAll} disabled={isImporting || isParsing || records.some(r => r.status === 'processing' || r.status === 'pending')}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isImporting ? t('reports.import.button.importing') : t('reports.import.button.importAll', { count: records.filter(r=>r.status ==='completed' || r.status === 'error' || r.status === 'skipped_quota').length })}
                    </Button>
                </div>
                 <div className="border rounded-md max-h-[50vh] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[200px]">{t('reports.import.table.fullName')}</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>{t('reports.import.table.comment')}</TableHead>
                                <TableHead>{t('reports.import.table.categoryAI')}</TableHead>
                                <TableHead>{t('reports.import.table.tagsAI')}</TableHead>
                                <TableHead className="text-right">{t('reports.import.table.status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.fullName}</TableCell>
                                    <TableCell>{record.company}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{record.comment}</TableCell>
                                    <TableCell>
                                        {record.aiCategory && <Badge variant={record.status === 'error' ? "destructive" : "secondary"}>{getCategoryNameForDisplay(record.aiCategory, t)}</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {record.aiTags?.map(tag => <Badge key={tag} variant="outline">{t(`tags.${tag}`)}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <StatusIndicator status={record.status} error={record.error} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )}

        {!file && !isParsing && records.length === 0 && (
             <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <FileX2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                    Pasirinkite failą
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Norėdami pradėti, įkelkite .xlsx formato failą.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
