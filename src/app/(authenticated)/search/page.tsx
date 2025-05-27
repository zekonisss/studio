
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import type { Report, SearchLog, ReportCategoryValue } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search as SearchIcon, User, CalendarDays, Tag, MessageSquare, AlertCircle, FileText, Image as ImageIcon, Globe, Filter } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { MOCK_GENERAL_REPORTS, combineAndDeduplicateReports, countries, getReportsFromLocalStoragePublic, getSearchLogsFromLocalStoragePublic, saveSearchLogsToLocalStoragePublic } from "@/types";
import DriverFilterForm from "@/components/shared/driver-filter-form"; // Import the new component


const DESTRUCTIVE_REPORT_CATEGORIES: ReportCategoryValue[] = ['kuro_vagyste', 'neblaivumas_darbe', 'zala_technikai', 'avaringumas'];


const getNationalityLabel = (nationalityCode?: string) => {
    if (!nationalityCode) return "";
    const country = countries.find(c => c.value === nationalityCode);
    return country ? country.label : nationalityCode;
};


export default function SearchPage() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

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

    const allLocalReports = getReportsFromLocalStoragePublic();
    const combinedDataSource = combineAndDeduplicateReports(allLocalReports, MOCK_GENERAL_REPORTS);

    const query = values.query.toLowerCase().trim();
    let results: Report[] = [];

    if (query) {
      results = combinedDataSource.filter(
        report =>
          report.fullName.toLowerCase().includes(query) ||
          report.id.toLowerCase().includes(query) ||
          (report.nationality && getNationalityLabel(report.nationality).toLowerCase().includes(query)) ||
          (report.birthYear && report.birthYear.toString().includes(query)) ||
          report.category.toLowerCase().includes(query.replace(/ /g, '_')) ||
          report.tags.some(tag => tag.toLowerCase().includes(query.replace(/ /g, '_'))) ||
          report.comment.toLowerCase().includes(query) ||
          (report.reporterCompanyName && report.reporterCompanyName.toLowerCase().includes(query))
      ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }


    setSearchResults(results);
    if (results.length === 0 && query) {
      setNoResults(true);
    }
    setIsLoading(false);

    if (user && query) {
      const newSearchLog: SearchLog = {
        id: `searchlog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
            Vairuotojų Paieška
          </CardTitle>
          <CardDescription>
            Įveskite vairuotojo vardą, pavardę, pilietybę, įmonės kodą, įrašo raktažodį ar kitą informaciją.
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
                    <FormLabel className="sr-only">Paieškos frazė</FormLabel>
                    <FormControl>
                      <Input placeholder="Vardas Pavardė, pilietybė, kodas, raktažodis..." {...field} className="text-base h-12"/>
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
                Ieškoti
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Driver Filter Form Card */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <Filter className="mr-3 h-6 w-6 text-primary" />
                Filtruoti Pagal Kategoriją
            </CardTitle>
            <CardDescription>
                Pasirinkite kategoriją norėdami matyti susijusias subkategorijas ir žymas.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <DriverFilterForm />
        </CardContent>
      </Card>


      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Ieškoma duomenų...</p>
        </div>
      )}

      {!isLoading && searchPerformed && noResults && (
        <Card className="shadow-md">
          <CardHeader className="items-center text-center">
             <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <CardTitle className="text-xl">Rezultatų Nerasta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Pagal jūsų paieškos užklausą "<span className="font-semibold">{form.getValues("query")}</span>" rezultatų nerasta. Patikslinkite paieškos kriterijus ir bandykite dar kartą.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !searchPerformed && !noResults && (
         <Card className="shadow-md text-center py-10">
             <CardContent>
                <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Įveskite paieškos frazę aukščiau, kad rastumėte įrašus.</p>
            </CardContent>
        </Card>
      )}


      {!isLoading && searchResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            Paieškos Rezultatai ({searchResults.length})
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
                                    G.m.: {report.birthYear}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge variant={DESTRUCTIVE_REPORT_CATEGORIES.includes(report.category as ReportCategoryValue) ? 'destructive' : 'secondary'} className="text-base py-1 px-3 ml-auto self-start">
                        {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                     <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                        <Tag className="mr-1.5 h-4 w-4" /> Kategorija
                      </h4>
                      <Badge variant={DESTRUCTIVE_REPORT_CATEGORIES.includes(report.category as ReportCategoryValue) ? 'destructive' : 'secondary'} className="text-base py-1 px-3">{report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                    </div>

                    {report.tags && report.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                          <Tag className="mr-1.5 h-4 w-4" /> Žymos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-sm">{tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                        <MessageSquare className="mr-1.5 h-4 w-4" /> Komentaras
                      </h4>
                      <p className="text-foreground text-base bg-secondary/30 p-3 rounded-md leading-relaxed">{report.comment}</p>
                    </div>
                  </div>
                  {report.imageUrl && (
                    <div className="md:col-span-1">
                       <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center">
                        <ImageIcon className="mr-1.5 h-4 w-4" /> Pridėtas failas/nuotrauka
                      </h4>
                      <div className="w-full overflow-hidden rounded-lg border border-border shadow-sm">
                        <Image
                          src={report.imageUrl}
                          alt={`Vaizdas įrašui apie ${report.fullName}`}
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
                        <p className="text-sm text-muted-foreground p-4 text-center">Nuotrauka ar failas nepridėtas.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-3 text-xs text-muted-foreground border-t">
                  <div className="flex justify-between w-full items-center">
                    <span>Pateikė: {report.reporterCompanyName ? report.reporterCompanyName : 'Nenurodyta'} (ID: {report.reporterId.substring(0,12)}...)</span>
                    <span>Data: {format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}</span>
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
