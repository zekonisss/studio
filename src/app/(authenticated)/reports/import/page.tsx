'use client';

import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/contexts/language-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileSpreadsheet,
  BrainCircuit,
  Loader2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileX2,
  XCircle,
  Info,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importAllReports, getAllReportsForExport, categorizeReportAction } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ParsedRecord {
  id: number;
  fullName: string;
  company?: string;
  comment: string;
  createdAt: string;
}

export type ClientParsedRecord = ParsedRecord & {
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped_quota' | 'active';
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
  const [isExporting, setIsExporting] = useState(false);
  const isCancelledRef = useRef(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (
        selectedFile &&
        (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))
      ) {
        setFile(selectedFile);
        setRecords([]);
      } else {
        toast({
          variant: 'destructive',
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
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const findHeader = (possibleNames: string[]): string | undefined => {
        const headerRow = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        for (const name of possibleNames) {
          const found = headerRow.find(
            (h) => h.trim().toLowerCase() === name.toLowerCase()
          );
          if (found) return found;
        }
        return undefined;
      };

      const fullNameHeader = findHeader(['Vairuotojas', 'Driver', 'Title', 'Full Name']);
      const commentHeader = findHeader(['Komentaras', 'Comment', 'Comments']);
      const companyHeader = findHeader(['Įmonė', 'Company']);
      const dateHeader = findHeader(['Data', 'Date']);

      if (!fullNameHeader || !commentHeader) {
        toast({
          variant: 'destructive',
          title: t('reports.import.toast.missingHeaders.title'),
          description: `Įsitikinkite, kad faile yra "Vairuotojas" ir "Komentaras" stulpeliai.`,
        });
        setIsParsing(false);
        return;
      }

      const clientRecords: ClientParsedRecord[] = jsonData
        .map((row, index) => ({
          id: index + 2,
          fullName: String(row[fullNameHeader] || 'Nežinomas vairuotojas'),
          comment: String(row[commentHeader] || ''),
          company: companyHeader ? String(row[companyHeader]) : undefined,
          createdAt:
            dateHeader && row[dateHeader]
              ? new Date(row[dateHeader]).toISOString()
              : new Date().toISOString(),
          status: 'pending' as const,
          aiCategory: '',
          aiTags: [],
        }))
        .filter((rec) => rec.fullName && rec.comment);

      if (clientRecords.length === 0) {
        toast({
          variant: 'destructive',
          title: t('reports.import.toast.emptyFile.title'),
          description: t('reports.import.toast.emptyFile.description'),
        });
        setIsParsing(false);
        return;
      }

      setRecords(clientRecords);
      // Pradedame AI analizę
      await processRecordsWithAI(clientRecords);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('reports.import.toast.parseError.title'),
        description: error.message || t('reports.import.toast.parseError.description'),
      });
    } finally {
      setIsParsing(false);
    }
  };

  const processRecordsWithAI = async (recordsToProcess: ClientParsedRecord[]) => {
    for (const record of recordsToProcess) {
      if (isCancelledRef.current) break;

      if (!record.comment) {
        updateRecordStatus(record.id, {
          status: 'error' as const,
          error: t('reports.import.error.noCommentForAi'),
        });
        continue;
      }

      updateRecordStatus(record.id, { status: 'processing' as const });
      
      try {
        // Kviečiame serverio akciją (Server Action)
        const result = await categorizeReportAction(record.comment);
        
        // Debug: matysime naršyklės konsolėje ką AI grąžino
        console.log(`AI result for record ${record.id}:`, result);

        updateRecordStatus(record.id, {
          status: 'completed' as const,
          aiCategory: result.categoryId,
          aiTags: result.suggestedTags,
        });
      } catch (error: any) {
        console.error(`AI Error for record ${record.id}:`, error);
        updateRecordStatus(record.id, {
          status: 'error' as const,
          error: error.message || t('reports.import.error.aiGenericError'),
          aiCategory: 'other_category',
          aiTags: [],
        });
      }
    }
  };

  const updateRecordStatus = (id: number, updates: Partial<ClientParsedRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleImportAll = async () => {
    if (!user) return;

    const recordsToImport = records.filter((r) =>
      ['completed', 'error', 'skipped_quota'].includes(r.status)
    );
    if (recordsToImport.length === 0) return;

    setIsImporting(true);
    try {
      const result = await importAllReports(
        recordsToImport,
        user.id,
        user.companyName
      );

      if (result.success) {
        toast({
          title: t('reports.import.toast.importSuccess.title'),
          description: t('reports.import.toast.importSuccess.description', {
            count: result.importedCount,
          }),
        });
        setFile(null);
        setRecords([]);
      } else {
        toast({
          variant: 'destructive',
          title: t('reports.import.toast.importError.title'),
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('reports.import.toast.importError.title'),
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleExport = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
        const reportsToExport = await getAllReportsForExport(user.companyName);

        if (reportsToExport.length === 0) {
            toast({
                title: "Nėra duomenų eksportui",
                description: "Nėra įrašų, kuriuos būtų galima eksportuoti jūsų įmonei.",
            });
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(reportsToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

        XLSX.writeFile(workbook, `DriverCheck_Reports_${user.companyName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error: any) {
        console.error("Export error:", error);
        toast({
            variant: "destructive",
            title: "Eksportavimo klaida",
            description: "Nepavyko paruošti failo eksportavimui."
        });
    } finally {
        setIsExporting(false);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setRecords((prev) =>
      prev.map((r) =>
        r.status === 'processing' || r.status === 'pending'
          ? { ...r, status: 'error' as const, error: 'Atšaukta vartotojo' }
          : r
      )
    );
  };

  const StatusIndicator = ({
    status,
    error,
  }: {
    status: ClientParsedRecord['status'];
    error?: string;
  }) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('reports.import.status.pending')}
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-2 text-blue-500">
            <BrainCircuit className="h-4 w-4 animate-spin" />
            {t('reports.import.status.processing')}
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {t('reports.import.status.completed')}
          </span>
        );
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
        );
      case 'skipped_quota':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2 text-amber-600 cursor-pointer">
                  <Info className="h-4 w-4" />
                  {t('reports.import.status.skippedQuota')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t('reports.import.status.skippedQuotaTooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };
  
  const canImport = useMemo(() => {
    if (isParsing || isImporting) return false;
    return records.some(r => ['completed', 'error', 'skipped_quota'].includes(r.status));
  }, [isParsing, isImporting, records]);


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
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>{t('reports.import.title')}</CardTitle>
            <CardDescription>
              {t('reports.import.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-auto flex-grow">
            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isParsing || isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('reports.import.selectedFile')}: {file.name}
              </p>
            )}
          </div>
          <Button
            onClick={handleFileParse}
            disabled={!file || isParsing || isImporting}
            className="w-full sm:w-auto"
          >
            {isParsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            {isParsing
              ? t('reports.import.button.parsing')
              : t('reports.import.button.parseFile')}
          </Button>
          {isParsing && (
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Stabdyti analizę
            </Button>
          )}
           <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Eksportuoti į Excel
          </Button>
        </div>

        {records.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {t('reports.import.previewTitle')} ({records.length})
              </h3>
              <Button onClick={handleImportAll} disabled={!canImport}>
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {isImporting
                  ? t('reports.import.button.importing')
                  : t('reports.import.button.importAll', {
                      count: records.filter((r) =>
                        ['completed', 'error', 'skipped_quota'].includes(r.status)
                      ).length,
                    })}
              </Button>
            </div>
            <div className="border rounded-md max-h-[50vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead>{t('reports.import.table.fullName')}</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>{t('reports.import.table.comment')}</TableHead>
                    <TableHead>{t('reports.import.table.categoryAI')}</TableHead>
                    <TableHead>{t('reports.import.table.tagsAI')}</TableHead>
                    <TableHead className="text-right">
                      {t('reports.import.table.status')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.fullName}
                      </TableCell>
                      <TableCell>{record.company}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {record.comment}
                      </TableCell>
                      <TableCell>
                        {record.aiCategory && (
                          <Badge
                            variant={
                              record.status === 'error' ? 'destructive' : 'secondary'
                            }
                          >
                            {getCategoryNameForDisplay(record.aiCategory, t)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.aiTags?.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {t(`tags.${tag}`)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusIndicator
                          status={record.status}
                          error={record.error}
                        />
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
            <h3 className="mt-4 text-lg font-semibold">Pasirinkite failą</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Norėdami pradėti, įkelkite .xlsx arba .xls formato failą.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}