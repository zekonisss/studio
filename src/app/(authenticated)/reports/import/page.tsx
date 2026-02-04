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
  Download,
  Copy,
  CalendarX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importAllReports, getAllReportsForExport } from './actions';
import { cleanImportRecord, type CleanImportResult } from '@/app/actions/genkit-import';
import { useAuth } from '@/hooks/use-auth';
import { getCategoryNameForDisplay, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { normalizeName } from '@/lib/driverHash';

export type ClientParsedRecord = {
  id: number;
  fullName: string;
  company?: string;
  comment: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  aiResult?: CleanImportResult;
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
  const [targetCompany, setTargetCompany] = useState('');
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
        setTargetCompany('');
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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

      const findHeader = (possibleNames: string[]): string | undefined => {
        const headerRow = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        for (const name of possibleNames) {
          const found = headerRow.find(h => h.trim().toLowerCase() === name.toLowerCase());
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
      
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
      const uniqueFingerprints = new Set<string>();
      let recordsToProcess: ClientParsedRecord[] = [];

      for (const [index, row] of jsonData.entries()) {
        const fullName = String(row[fullNameHeader] || '').trim();
        const comment = String(row[commentHeader] || '').trim();

        if (!fullName || !comment) continue;

        const recordDateStr = row[dateHeader] || new Date().toISOString();
        let recordDate: Date;
        if (typeof recordDateStr === 'number') {
            recordDate = XLSX.SSF.parse_date_code(recordDateStr) as any;
        } else {
            recordDate = new Date(recordDateStr);
        }

        const baseRecord = {
          id: index + 2,
          fullName,
          comment,
          company: companyHeader ? String(row[companyHeader] || '') : undefined,
          createdAt: recordDate.toISOString(),
        };

        if (isNaN(recordDate.getTime())) {
          recordsToProcess.push({ ...baseRecord, status: 'error', error: 'Neteisingas datos formatas.' });
          continue;
        }

        const fingerprint = `${normalizeName(fullName)}|${recordDate.toISOString().split('T')[0]}`;
        if (uniqueFingerprints.has(fingerprint)) {
          recordsToProcess.push({ ...baseRecord, status: 'error', error: 'Pasikartojantis įrašas faile.' });
          continue;
        }
        uniqueFingerprints.add(fingerprint);

        if (recordDate < cutoffDate) {
          recordsToProcess.push({ ...baseRecord, status: 'error', error: 'Įrašas senesnis nei 10 metų.' });
          continue;
        }

        recordsToProcess.push({ ...baseRecord, status: 'pending' });
      }

      if (recordsToProcess.length === 0) {
        toast({
          variant: 'destructive',
          title: t('reports.import.toast.emptyFile.title'),
          description: t('reports.import.toast.emptyFile.description'),
        });
      } else {
        setRecords(recordsToProcess);
        processRecordsWithAI(recordsToProcess.filter(r => r.status === 'pending'));
      }
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

      updateRecordStatus(record.id, { status: 'processing' });
      
      try {
        const result = await cleanImportRecord({ text: record.comment, recordDate: record.createdAt });
        
        if (result.isValid) {
          updateRecordStatus(record.id, {
            status: 'completed',
            aiResult: result,
            error: undefined,
          });
        } else {
          updateRecordStatus(record.id, {
            status: 'error',
            error: result.rejectionReason || "AI atmetė įrašą be priežasties."
          });
        }
      } catch (error: any) {
        console.error(`AI Error for record ${record.id}:`, error);
        updateRecordStatus(record.id, {
          status: 'error',
          error: error.message || t('reports.import.error.aiGenericError'),
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
    if (!user || !targetCompany) return;

    const recordsToImport = records.filter(r => r.status === 'completed');
    if (recordsToImport.length === 0) {
        toast({
            variant: "destructive",
            title: "Nėra įrašų importavimui",
            description: "Nėra sėkmingai apdorotų įrašų, kuriuos būtų galima importuoti."
        });
        return;
    };

    setIsImporting(true);
    try {
      const result = await importAllReports(recordsToImport, user.id, targetCompany);

      if (result.success) {
        toast({
          title: t('reports.import.toast.importSuccess.title'),
          description: t('reports.import.toast.importSuccess.description', { count: result.importedCount }),
        });
        setFile(null);
        setRecords([]);
        setTargetCompany('');
      } else {
        toast({ variant: 'destructive', title: t('reports.import.toast.importError.title'), description: result.error });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('reports.import.toast.importError.title'), description: error.message });
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
            toast({ title: "Nėra duomenų eksportui" });
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(reportsToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
        XLSX.writeFile(workbook, `DriverCheck_Reports_${user.companyName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Eksportavimo klaida" });
    } finally {
        setIsExporting(false);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setRecords((prev) =>
      prev.map((r) =>
        r.status === 'processing' || r.status === 'pending'
          ? { ...r, status: 'error', error: 'Atšaukta vartotojo' }
          : r
      )
    );
  };

  const StatusIndicator = ({ record }: { record: ClientParsedRecord }) => {
    const { status, error } = record;
    switch (status) {
      case 'pending': return <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Laukiama</span>;
      case 'processing': return <span className="flex items-center gap-2 text-blue-500"><BrainCircuit className="h-4 w-4 animate-spin" />Analizuojama</span>;
      case 'completed': return <span className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" />Paruošta</span>;
      case 'error':
        let icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
        if (error?.includes('Pasikartojantis')) icon = <Copy className="h-4 w-4 shrink-0" />;
        if (error?.includes('senesnis')) icon = <CalendarX className="h-4 w-4 shrink-0" />;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <span className="flex items-center gap-2 text-destructive cursor-help">{icon}<span className="truncate">{error || 'Klaida'}</span></span>
              </TooltipTrigger>
              <TooltipContent><p className="max-w-xs">{error}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default: return null;
    }
  };
  
  const canImport = useMemo(() => {
    if (isParsing || isImporting) return false;
    return records.some(r => r.status === 'completed');
  }, [isParsing, isImporting, records]);


  if (!user?.isAdmin) {
    return (
      <Card>
        <CardHeader><CardTitle>Prieiga negalima</CardTitle></CardHeader>
        <CardContent><p>Šis puslapis prieinamas tik administratoriams.</p></CardContent>
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
            <CardDescription>{t('reports.import.description')}</CardDescription>
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
          {isParsing && <Button onClick={handleCancel} variant="destructive" className="w-full sm:w-auto"><XCircle className="mr-2 h-4 w-4" />Stabdyti analizę</Button>}
           <Button onClick={handleExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Eksportuoti į Excel</Button>
        </div>

        {records.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="w-full md:w-auto">
                 <Label htmlFor="targetCompany" className="text-xs font-semibold text-muted-foreground">Importuoti į įmonę:</Label>
                 <Input id="targetCompany" placeholder="Įveskite įmonės pavadinimą..." value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} disabled={isImporting} className="w-full md:w-72 mt-1" />
              </div>
              <Button onClick={handleImportAll} disabled={!canImport || !targetCompany}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isImporting ? t('reports.import.button.importing') : t('reports.import.button.importAll', { count: records.filter((r) => r.status === 'completed').length })}
              </Button>
            </div>
            <div className="border rounded-md max-h-[50vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                  <TableRow>
                    <TableHead>Vairuotojas</TableHead>
                    <TableHead>Originalus tekstas</TableHead>
                    <TableHead>AI išvalytas tekstas</TableHead>
                    <TableHead>Kategorija</TableHead>
                    <TableHead>Gim. metai (AI)</TableHead>
                    <TableHead className="text-right">Būsena</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className={cn(record.status === 'error' && 'bg-red-500/10 opacity-70')}>
                      <TableCell className="font-medium">{record.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{record.comment}</TableCell>
                      <TableCell className={cn("text-sm max-w-xs truncate", record.status === 'completed' && 'text-green-700 dark:text-green-400')}>
                        {record.aiResult?.sanitizedText}
                      </TableCell>
                      <TableCell>
                        {record.aiResult?.categoryId && record.status === 'completed' && <Badge variant="secondary">{getCategoryNameForDisplay(record.aiResult.categoryId, t)}</Badge>}
                      </TableCell>
                      <TableCell>{record.aiResult?.birthYear}</TableCell>
                      <TableCell className="text-right"><StatusIndicator record={record} /></TableCell>
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
            <p className="mt-2 text-sm text-muted-foreground">Norėdami pradėti, įkelkite .xlsx arba .xls formato failą.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
