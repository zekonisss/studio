"use client";

import { useState } from "react";
import * as ExcelJS from "exceljs";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, BrainCircuit, Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileX2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categorizeReport } from "@/ai/flows/categorize-report-flow";
import { addReport } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";
import { getCategoryNameForDisplay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ParsedRecord {
  id: number;
  fullName: string;
  company?: string;
  comment: string;
  createdAt: string; 
  status: 'pending' | 'processing' | 'completed' | 'error';
  aiCategory?: string;
  aiTags?: string[];
  error?: string;
}

export default function ReportsImportPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
  
  const findHeader = (headers: Record<string, number>, possibleNames: string[]): number | undefined => {
    for (const name of possibleNames) {
      const colIndex = headers[name.trim().toLowerCase()];
      if (colIndex !== undefined) {
        return colIndex;
      }
    }
    return undefined;
  };


  const parseFile = async () => {
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast({ variant: "destructive", title: t('reports.import.toast.emptyFile.title'), description: 'No worksheet found in the file.' });
          setIsParsing(false);
          return;
        }

        const headerRow = worksheet.getRow(1);
        const headers: Record<string, number> = {};
        headerRow.eachCell((cell, colNumber) => {
            if (cell.value) {
                headers[String(cell.value).trim().toLowerCase()] = colNumber;
            }
        });
        
        const fullNameCol = findHeader(headers, ['title']);
        const commentCol = findHeader(headers, ['comment']);
        
        const missingHeaders: string[] = [];
        if (fullNameCol === undefined) missingHeaders.push('Title');
        if (commentCol === undefined) missingHeaders.push('Comment');

        if (missingHeaders.length > 0) {
            toast({ variant: "destructive", title: t('reports.import.toast.missingHeaders.title'), description: `Trūkstamų stulpelių: ${missingHeaders.join(', ')}` });
            setIsParsing(false);
            return;
        }

        const dateCol = findHeader(headers, ['date']);
        const companyCol = findHeader(headers, ['company']);
        
        const parsedRecords: ParsedRecord[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const fullName = fullNameCol ? (row.getCell(fullNameCol).value as string || t('reports.import.unknownDriver')) : t('reports.import.unknownDriver');
            const comment = commentCol ? (row.getCell(commentCol).value as string || '') : '';
            const company = companyCol ? row.getCell(companyCol)?.value as string | undefined : undefined;
            
            const dateValue = dateCol ? row.getCell(dateCol)?.value : undefined;
            const createdAt = dateValue instanceof Date ? dateValue.toISOString() : new Date().toISOString();


            if (fullName && comment) {
                parsedRecords.push({
                    id: rowNumber,
                    fullName,
                    company,
                    comment,
                    createdAt,
                    status: 'pending'
                });
            }
        });

        if (parsedRecords.length === 0) {
             toast({ variant: "destructive", title: t('reports.import.toast.emptyFile.title'), description: t('reports.import.toast.emptyFile.description') });
             setIsParsing(false);
             return;
        }

        setRecords(parsedRecords);
        await processRecordsWithAI(parsedRecords);

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: t('reports.import.toast.parseError.title'), description: t('reports.import.toast.parseError.description') });
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const processRecordsWithAI = async (recordsToProcess: ParsedRecord[]) => {
      for (const record of recordsToProcess) {
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
          } catch (error) {
              console.error(`AI error for record ${record.id}:`, error);
              updateRecordStatus(record.id, { status: 'error', error: t('reports.import.error.aiGenericError') });
          }
      }
  };

  const updateRecordStatus = (id: number, updates: Partial<ParsedRecord>) => {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  
  const handleImportAll = async () => {
    if (!user) {
        toast({ variant: "destructive", title: t('toast.login.error.title'), description: t('toast.login.error.accessDenied') });
        return;
    }

    const recordsToImport = records.filter(r => r.status === 'completed' && r.aiCategory);
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
                category: rec.aiCategory!,
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
  
  const StatusIndicator = ({ status }: { status: ParsedRecord['status'] }) => {
      switch (status) {
          case 'pending': return <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t('reports.import.status.pending')}</span>
          case 'processing': return <span className="flex items-center gap-2 text-blue-500"><BrainCircuit className="h-4 w-4 animate-spin" />{t('reports.import.status.processing')}</span>
          case 'completed': return <span className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" />{t('reports.import.status.completed')}</span>
          case 'error': return <span className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />{t('reports.import.status.error')}</span>
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
                <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isParsing} />
                {file && <p className="text-sm text-muted-foreground mt-2">{t('reports.import.selectedFile')}: {file.name}</p>}
            </div>
            <Button onClick={parseFile} disabled={!file || isParsing} className="w-full sm:w-auto">
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {isParsing ? t('reports.import.button.parsing') : t('reports.import.button.parseFile')}
            </Button>
        </div>

        {records.length > 0 && (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('reports.import.previewTitle')} ({records.length} {t('reports.import.recordsFound')})</h3>
                     <Button onClick={handleImportAll} disabled={isImporting || isParsing || records.every(r => r.status !== 'completed')}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isImporting ? t('reports.import.button.importing') : t('reports.import.button.importAll', { count: records.filter(r=>r.status==='completed').length })}
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
                                        {record.aiCategory && <Badge variant="secondary">{getCategoryNameForDisplay(record.aiCategory, t)}</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {record.aiTags?.map(tag => <Badge key={tag} variant="outline">{t(`tags.${tag}`)}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <StatusIndicator status={record.status}/>
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
