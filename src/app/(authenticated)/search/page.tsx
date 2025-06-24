
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import type { Report, SearchLog } from "@/types"; 
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search as SearchIcon, User, CalendarDays, Tag, MessageSquare, AlertCircle, FileText, Image as ImageIcon, Globe, Layers } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { lt, enUS } from 'date-fns/locale'; 
import { MOCK_GENERAL_REPORTS, combineAndDeduplicateReports, countries, getReportsFromLocalStoragePublic, getSearchLogsFromLocalStoragePublic, saveSearchLogsToLocalStoragePublic, detailedReportCategories, DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/types";
import { useLanguage } from "@/contexts/language-context"; 

// Helper function to migrate old Lithuanian tag values to keys
const migrateTagIfNeeded = (tagValue: string): string => {
  if (typeof tagValue !== 'string') return tagValue; 

  const lithuanianToKeyMap: Record<string, string> = {
    "Kuro vagystė": "kuro_vagyste",
    "Krovinio vagystė": "krovinio_vagyste",
    "Įmonės turto vagystė": "imones_turto_vagyste",
    "Avaringumas": "avaringumas",
    "Pavojingas vairavimas": "pavojingas_vairavimas",
    "Dažni KET pažeidimai": "dazni_ket_pazeidimai",
    "Grasinimai / agresija": "grasinimai_agresija",
    "Netinkamas elgesys kolegų atžvilgiu": "netinkamas_elgesys_kolegu_atzvilgiu",
    "Psichotropinių medžiagų vartojimas": "psichotropiniu_medziagu_vartojimas",
    "Konfliktiškas asmuo": "konfliktiskas_asmuo",
    "Neblaivus darbo metu": "neblaivus_darbo_metu",
    "Neatvykimas į darbą be pateisinamos priežasties": "neatvykimas_i_darba_be_pateisinamos_priezasties",
    "Neatsakingas požiūris į darbą": "neatsakingas_poziuris_i_darba",
    "Techninis neatsakingumas": "techninis_neatsakingumas",
    "Rizika saugumui ar kroviniui": "rizika_saugumui_ar_kroviniui",
    "Dažni transporto priemonės pažeidimai": "dazni_transporto_priemones_pazeidimai",
    "Buvo teisinis procesas / darbo ginčas": "buvo_teisinis_procesas_darbo_gincas",
    "Pakenkta įmonės reputacijai": "pakenkta_imones_reputacijai",
    "Neteisėta veikla įtariama": "neteiseta_veikla_itariama",
    "Kita": "kita_tag" // Important: "Kita" from old system should map to "kita_tag"
  };

  if (lithuanianToKeyMap[tagValue]) {
    return lithuanianToKeyMap[tagValue];
  }

  // Heuristic to catch already prefixed old values if they snuck in
  if (tagValue.startsWith("tags.")) { 
    const potentialPhrase = tagValue.substring(5);
    if (lithuanianToKeyMap[potentialPhrase]) {
      return lithuanianToKeyMap[potentialPhrase];
    }
  }
  
  return tagValue; // Return original if no mapping or it's already a key
};


export default function SearchPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage(); 
  const [searchResults, setSearchResults] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const dateLocale = locale === 'en' ? enUS : lt;

  const getNationalityLabel = (nationalityCode?: string) => {
    if (!nationalityCode) return "";
    const country = countries.find(c => c.value === nationalityCode);
    return country ? t('countries.' + country.value) : nationalityCode; 
  };

  const getCategoryNameSearch = (categoryId: string) => {
    const category = detailedReportCategories.find(c => c.id === categoryId);
    return category ? t(category.nameKey) : categoryId;
  };


  const form = useForm<SearchFormValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { query: "" },
  });

  const handleSearch = async (values: SearchFormValues) => {
    setIsLoading(true);
    setNoResults(false);
    setSearchResults([]);
    setSearchPerformed(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allLocalReportsRaw = getReportsFromLocalStoragePublic();
    const migratedLocalReports = allLocalReportsRaw.map(report => ({
      ...report,
      createdAt: new Date(report.createdAt), // Ensure createdAt is a Date object
      tags: Array.isArray(report.tags) ? report.tags.map(migrateTagIfNeeded) : [],
    }));

    // Filter out deleted reports and combine with mock data
    const activeLocalReports = migratedLocalReports.filter(r => !r.deletedAt);
    const activeMockReports = MOCK_GENERAL_REPORTS.filter(r => !r.deletedAt);
    const combinedDataSource = combineAndDeduplicateReports(activeLocalReports, activeMockReports.map(r => ({...r, createdAt: new Date(r.createdAt)})));

    const query = values.query.toLowerCase().trim();
    let results: Report[] = [];

    if (query) {
      results = combinedDataSource.filter(report => {
          const mainCategoryName = getCategoryNameSearch(report.category).toLowerCase();
          const nationalityLabel = report.nationality ? getNationalityLabel(report.nationality).toLowerCase() : "";

          return (
            report.fullName.toLowerCase().includes(query) ||
            report.id.toLowerCase().includes(query) ||
            (nationalityLabel && nationalityLabel.includes(query)) ||
            (report.birthYear && report.birthYear.toString().includes(query)) ||
            mainCategoryName.includes(query) ||
            report.tags.some(tagKey => t('tags.' + tagKey).toLowerCase().includes(query)) || 
            report.comment.toLowerCase().includes(query) ||
            (report.reporterCompanyName && report.reporterCompanyName.toLowerCase().includes(query))
          );
        }
      ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }


    setSearchResults(results);
    if (results.length === 0 && query) {
      setNoResults(true);
    }
    setIsLoading(false);

    if (user && query) {
      const newSearchLog: SearchLog = {
        id: 'searchlog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        searchText: values.query,
        timestamp: new Date(),
        resultsCount: results.length,
      };
      const existingLogs = getSearchLogsFromLocalStoragePublic();
      saveSearchLogsToLocalStoragePublic([newSearchLog, ...existingLogs]);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <SearchIcon className="mr-3 h-7 w-7 text-primary" />
            {t('search.title')}
          </CardTitle>
          <CardDescription>
            {t('search.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex flex-col sm:flex-row gap-4 items-start">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full sm:w-auto">
                    <FormLabel className="sr-only">{t('search.queryLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('search.queryPlaceholder')} {...field} className="text-base h-12"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-12 text-base">
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <SearchIcon className="mr-2 h-5 w-5" />
                )}
                {t('search.searchButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">{t('search.loading')}</p>
        </div>
      )}

      {!isLoading && searchPerformed && noResults && (
        <Card className="shadow-md">
          <CardHeader className="items-center text-center">
             <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <CardTitle className="text-xl">{t('search.noResults.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {t('search.noResults.message', { query: form.getValues("query") })}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !searchPerformed && !noResults && (
         <Card className="shadow-md text-center py-10">
             <CardContent>
                <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t('search.initialMessage')}</p>
            </CardContent>
        </Card>
      )}


      {!isLoading && searchResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            {t('search.results.title', { count: searchResults.length })}
          </h2>
          <div className="space-y-6">
            {searchResults.map((report) => (
              <Card key={report.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-muted/30 p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center">
                            <User className="mr-2 h-5 w-5 text-primary" />
                            {report.fullName}
                        </CardTitle>
                        <div className="flex items-center text-sm space-x-4">
                            {report.nationality && (
                                <span className="flex items-center text-muted-foreground">
                                    <Globe className="mr-1.5 h-4 w-4" />
                                    {getNationalityLabel(report.nationality)}
                                </span>
                            )}
                            {report.birthYear && (
                                <span className="flex items-center text-muted-foreground">
                                    <CalendarDays className="mr-1.5 h-4 w-4" />
                                    {t('search.results.birthYearPrefix')}{report.birthYear}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'} className="text-base py-1 px-3 ml-auto self-start">
                        {getCategoryNameSearch(report.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                     <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                        <Layers className="mr-1.5 h-4 w-4" /> {t('search.results.mainCategory')}
                      </h4>
                      <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'} className="text-base py-1 px-3">{getCategoryNameSearch(report.category)}</Badge>
                    </div>

                    {report.tags && report.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                          <Tag className="mr-1.5 h-4 w-4" /> {t('search.results.tags')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.tags.map(tagKey => (
                            <Badge key={tagKey} variant="outline" className="text-sm">{t('tags.' + tagKey)}</Badge> 
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                        <MessageSquare className="mr-1.5 h-4 w-4" /> {t('search.results.comment')}
                      </h4>
                      <p className="text-foreground text-base bg-secondary/30 p-3 rounded-md leading-relaxed">{report.comment}</p>
                    </div>
                  </div>
                  {report.imageUrl && (
                    <div className="md:col-span-1">
                       <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center">
                        <ImageIcon className="mr-1.5 h-4 w-4" /> {t('search.results.attachedFile')}
                      </h4>
                      <div className="w-full overflow-hidden rounded-lg border border-border shadow-sm">
                        <Image
                          src={report.imageUrl}
                          alt={t('search.results.imageAlt', { fullName: report.fullName })}
                          width={600}
                          height={400}
                          layout="responsive"
                          objectFit="contain"
                          data-ai-hint={report.dataAiHint || "incident document"}
                        />
                      </div>
                    </div>
                  )}
                   {!report.imageUrl && (
                     <div className="md:col-span-1 flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground p-4 text-center">{t('search.results.noFileAttached')}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-3 text-xs text-muted-foreground border-t">
                  <div className="flex justify-between w-full items-center">
                    <span>{t('search.results.submittedBy')}: {report.reporterCompanyName ? report.reporterCompanyName : t('common.notSpecified')} (ID: {report.reporterId.substring(0,12)}...)</span>
                    <span>{t('search.results.date')}: {format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: dateLocale })}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
