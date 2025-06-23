
"use client";

import { useState, ChangeEvent, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Users2, AlertCircleIcon, Check, ShieldCheck, Briefcase, Mail, Phone, Building2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { UserProfile } from '@/types';
import { getAllUsers, saveAllUsers } from '@/types';
import { useRouter } from "next/navigation";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SignUpSchema } from '@/lib/schemas'; // Naudosime dalį schemos validacijai

interface ParsedUserRow {
  id: number; // Unikalus ID React raktui
  originalRow: Record<string, any>;
  userPreview: Partial<UserProfile>; // Apkarpyta UserProfile versija peržiūrai
  validationStatus: 'pending' | 'valid' | 'invalid';
  errors?: string[];
}

// Tikėtinos antraštės lietuvių kalba (pagrindinė kalba stulpelių atpažinimui)
const REQUIRED_USER_HEADERS_LT = ["Įmonės Pavadinimas", "Įmonės Kodas", "Kontaktinis Asmuo", "El. Paštas", "Telefonas"];
const OPTIONAL_USER_HEADERS_LT = ["PVM Kodas", "Adresas"];

// Angliški atitikmenys ir galimi variantai
const USER_HEADER_MAPPINGS: Record<string, keyof UserProfile | 'raw_password_excel'> = {
    "Įmonės Pavadinimas": "companyName",
    "Company Name": "companyName",
    "Įmonės Kodas": "companyCode",
    "Company Code": "companyCode",
    "Kontaktinis Asmuo": "contactPerson",
    "Contact Person": "contactPerson",
    "El. Paštas": "email",
    "Email": "email",
    "Telefonas": "phone",
    "Phone": "phone",
    "PVM Kodas": "vatCode",
    "VAT Code": "vatCode",
    "Adresas": "address",
    "Address": "address",
    // Slaptažodžių neimportuosime tiesiogiai, bet galime leisti stulpelį Excelyje, kurį ignoruosime
    "Slaptažodis": "raw_password_excel", 
    "Password": "raw_password_excel"
};


export default function ImportUsersPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedUserRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!adminUser || !adminUser.isAdmin)) {
      toast({
        variant: "destructive",
        title: t('usersImport.toast.accessDenied.title'),
        description: t('usersImport.toast.accessDenied.description'),
      });
      router.replace('/dashboard');
    }
  }, [adminUser, authLoading, router, toast, t]);

  const findHeaderKey = (headerRow: string[], targetHeaderLT: string): keyof UserProfile | 'raw_password_excel' | undefined => {
    const lowerTargetHeaderLT = targetHeaderLT.toLowerCase();
    const foundHeader = headerRow.find(header => 
      (typeof header === 'string' && header.toLowerCase() === lowerTargetHeaderLT) ||
      (USER_HEADER_MAPPINGS[header as string]?.toLowerCase() === USER_HEADER_MAPPINGS[targetHeaderLT]?.toLowerCase())
    );
    return foundHeader ? USER_HEADER_MAPPINGS[foundHeader] || USER_HEADER_MAPPINGS[targetHeaderLT] : undefined;
  };

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
          title: t('usersImport.toast.invalidFileType.title'),
          description: t('usersImport.toast.invalidFileType.description'),
        });
        setFile(null);
        setFileName(null);
        event.target.value = ""; // Reset file input
      }
    }
  };

  const validateRow = (rowData: Partial<UserProfile>, existingUsers: UserProfile[]): string[] => {
    const errors: string[] = [];
    
    // Naudojame SignUpSchema dalis validacijai, pritaikome importavimui
    // Privalomi laukai
    if (!rowData.companyName || rowData.companyName.length < 2) errors.push(t('usersImport.validation.companyNameMinLength'));
    if (!rowData.companyCode || !/^\d{9}$/.test(rowData.companyCode)) errors.push(t('usersImport.validation.companyCodeFormat'));
    if (!rowData.contactPerson || rowData.contactPerson.length < 3) errors.push(t('usersImport.validation.contactPersonMinLength'));
    if (!rowData.email || !z.string().email().safeParse(rowData.email).success) errors.push(t('usersImport.validation.emailFormat'));
    if (!rowData.phone || !/^\+?\d{7,15}$/.test(rowData.phone)) errors.push(t('usersImport.validation.phoneFormat'));

    // Unikalumo tikrinimai
    if (rowData.email && existingUsers.some(u => u.email.toLowerCase() === rowData.email!.toLowerCase())) {
      errors.push(t('usersImport.validation.emailExists', { email: rowData.email }));
    }
    if (rowData.companyCode && existingUsers.some(u => u.companyCode === rowData.companyCode)) {
       errors.push(t('usersImport.validation.companyCodeExists', { code: rowData.companyCode }));
    }

    // Neprivalomi laukai (jei yra, tikriname formatą)
    if (rowData.address && rowData.address.length < 5) errors.push(t('usersImport.validation.addressMinLength'));
    // VAT kodui galima pridėti regex validaciją pagal poreikį

    return errors;
  };


  const handleParseFile = async () => {
    if (!file || !adminUser) return;
    setIsLoadingFile(true);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
            throw new Error(t('usersImport.error.fileReadError'));
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];
        
        if (jsonData.length < 2) { // Tikimės bent antraštės ir vienos duomenų eilutės
          toast({ variant: "destructive", title: t('usersImport.toast.emptyFile.title'), description: t('usersImport.toast.emptyFile.description') });
          setIsLoadingFile(false);
          return;
        }

        const headerRow = jsonData[0].map(h => String(h).trim());
        const dataRows = jsonData.slice(1);

        // Stulpelių atpažinimas
        const mappedHeaderKeys: Partial<Record<keyof UserProfile, string>> = {};
        REQUIRED_USER_HEADERS_LT.forEach(reqHeaderLt => {
            const key = findHeaderKey(headerRow, reqHeaderLt);
            const excelHeaderName = headerRow.find(h => USER_HEADER_MAPPINGS[h] === key || h.toLowerCase() === reqHeaderLt.toLowerCase());
            if (key && excelHeaderName && key !== 'raw_password_excel') {
                mappedHeaderKeys[key as keyof UserProfile] = excelHeaderName;
            }
        });
         OPTIONAL_USER_HEADERS_LT.forEach(optHeaderLt => {
            const key = findHeaderKey(headerRow, optHeaderLt);
            const excelHeaderName = headerRow.find(h => USER_HEADER_MAPPINGS[h] === key || h.toLowerCase() === optHeaderLt.toLowerCase());
            if (key && excelHeaderName && key !== 'raw_password_excel') {
                 mappedHeaderKeys[key as keyof UserProfile] = excelHeaderName;
            }
        });


        const missingRequiredHeaders = REQUIRED_USER_HEADERS_LT.filter(
          headerLt => !findHeaderKey(headerRow, headerLt)
        );

        if (missingRequiredHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: t('usersImport.toast.missingHeaders.title'),
            description: t('usersImport.toast.missingHeaders.description', { headers: missingRequiredHeaders.join(', ') }),
            duration: 7000,
          });
          setIsLoadingFile(false);
          return;
        }
        
        const existingUsers = getAllUsers();
        const newParsedData: ParsedUserRow[] = dataRows.map((row, index) => {
          const originalRow: Record<string, any> = {};
          headerRow.forEach((header, i) => {
            originalRow[String(header).trim()] = row[i];
          });
          
          const userPreviewData: Partial<UserProfile> = {};
          for (const [internalKey, excelHeaderName] of Object.entries(mappedHeaderKeys)) {
              const headerIndex = headerRow.findIndex(h => h === excelHeaderName);
              if (headerIndex !== -1 && row[headerIndex] !== undefined && row[headerIndex] !== null) {
                (userPreviewData as any)[internalKey] = String(row[headerIndex]).trim();
              }
          }
          
          const validationErrors = validateRow(userPreviewData, existingUsers);

          return {
            id: index,
            originalRow,
            userPreview: userPreviewData,
            validationStatus: validationErrors.length === 0 ? 'valid' : 'invalid',
            errors: validationErrors.length > 0 ? validationErrors : undefined,
          };
        }).filter(row => Object.keys(row.userPreview).length > 0); // Filtruojame visiškai tuščias eilutes

        setParsedData(newParsedData);

      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: t('usersImport.toast.parseError.title'), description: (err as Error).message || t('usersImport.toast.parseError.description') });
      } finally {
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportData = async () => {
    if (!adminUser) return;
    const validRows = parsedData.filter(row => row.validationStatus === 'valid');
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: t('usersImport.toast.noDataToImport.title'), description: t('usersImport.toast.noDataToImport.description') });
      return;
    }

    setIsImporting(true);
    try {
      const existingUsers = getAllUsers();
      const newUsers: UserProfile[] = validRows.map(row => ({
        id: `imported-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${row.id}`,
        companyName: row.userPreview.companyName!,
        companyCode: row.userPreview.companyCode!,
        contactPerson: row.userPreview.contactPerson!,
        email: row.userPreview.email!,
        phone: row.userPreview.phone!,
        vatCode: row.userPreview.vatCode || undefined,
        address: row.userPreview.address || '',
        paymentStatus: 'pending_verification',
        isAdmin: false,
        registeredAt: new Date().toISOString(),
        accountActivatedAt: undefined,
        agreeToTerms: true, // Admin import implies this for now
        subUsers: [],
      }));

      saveAllUsers([...existingUsers, ...newUsers]);
      toast({
        title: t('usersImport.toast.importSuccess.title'),
        description: t('usersImport.toast.importSuccess.description', { count: newUsers.length }),
      });
      setParsedData([]);
      setFile(null);
      setFileName(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: t('usersImport.toast.importError.title'), description: (err as Error).message || t('usersImport.toast.importError.description') });
    } finally {
      setIsImporting(false);
    }
  };
  
  const validCount = useMemo(() => parsedData.filter(r => r.validationStatus === 'valid').length, [parsedData]);

  if (authLoading || (!adminUser || !adminUser.isAdmin)) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderValidationStatusIcon = (status: ParsedUserRow['validationStatus']) => {
    switch (status) {
      case 'pending': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>{t('usersImport.status.pendingValidation')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'valid': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><Check className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>{t('usersImport.status.valid')}</p></TooltipContent></Tooltip></TooltipProvider>;
      case 'invalid': return <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 cursor-default"><AlertCircleIcon className="h-4 w-4 text-red-500" /></Button></TooltipTrigger><TooltipContent><p>{t('usersImport.status.invalid')}</p></TooltipContent></Tooltip></TooltipProvider>;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Users2 className="mr-3 h-7 w-7 text-primary" />
            {t('usersImport.title')}
          </CardTitle>
          <CardDescription>
            {t('usersImport.description')}
            <br/>
            {t('usersImport.expectedHeaders', { headers: REQUIRED_USER_HEADERS_LT.join('", "') + '". ' + t('usersImport.optionalHeaders') + ': "' + OPTIONAL_USER_HEADERS_LT.join('", "') })}
            <br/>
            {t('usersImport.passwordNote')}
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
              disabled={isLoadingFile || isImporting}
            />
            <Button onClick={handleParseFile} disabled={!file || isLoadingFile || isImporting} className="w-full sm:w-auto">
              {isLoadingFile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isLoadingFile ? t('usersImport.button.parsing') : t('usersImport.button.parseFile')}
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground">{t('usersImport.selectedFile')}: {fileName}</p>}
          
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('usersImport.previewTitle')} ({parsedData.length} {t('usersImport.recordsFound')})</h3>
              
              <div className="max-h-[500px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 z-10">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">{t('usersImport.table.status')}</TableHead>
                      <TableHead><Building2 className="inline h-4 w-4 mr-1" />{t('usersImport.table.companyName')}</TableHead>
                      <TableHead><Briefcase className="inline h-4 w-4 mr-1" />{t('usersImport.table.companyCode')}</TableHead>
                      <TableHead><Users2 className="inline h-4 w-4 mr-1" />{t('usersImport.table.contactPerson')}</TableHead>
                      <TableHead><Mail className="inline h-4 w-4 mr-1" />{t('usersImport.table.email')}</TableHead>
                      <TableHead><Phone className="inline h-4 w-4 mr-1" />{t('usersImport.table.phone')}</TableHead>
                      <TableHead><MapPin className="inline h-4 w-4 mr-1" />{t('usersImport.table.address')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.id} className={row.validationStatus === 'invalid' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                        <TableCell className="text-center align-top pt-3">{renderValidationStatusIcon(row.validationStatus)}</TableCell>
                        <TableCell className="align-top pt-3">{row.userPreview.companyName || '-'}</TableCell>
                        <TableCell className="align-top pt-3">{row.userPreview.companyCode || '-'}</TableCell>
                        <TableCell className="align-top pt-3">{row.userPreview.contactPerson || '-'}</TableCell>
                        <TableCell className="align-top pt-3">{row.userPreview.email || '-'}</TableCell>
                        <TableCell className="align-top pt-3">{row.userPreview.phone || '-'}</TableCell>
                        <TableCell className="align-top pt-3 text-xs max-w-xs whitespace-pre-wrap">
                          {row.userPreview.address || '-'}
                          {row.errors && row.errors.length > 0 && (
                            <ul className="text-red-600 text-xs mt-1 list-disc list-inside">
                              {row.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          )}
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
              disabled={isImporting || isLoadingFile || validCount === 0} 
              className="w-full sm:w-auto ml-auto"
            >
                {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                {isImporting ? t('usersImport.button.importing') : t('usersImport.button.importAll', { count: validCount })}
            </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  );
}

