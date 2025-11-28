
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { useState, useEffect } from "react";
import type { Report } from "@/types";
import { getAllReports, addSearchLog } from "@/lib/server/db";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from '@/lib/constants';
import { getCategoryNameForDisplay, migrateTagIfNeeded } from "@/lib/utils";

export default function SearchPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      query: "",
    },
  });

  useEffect(() => {
    setLoading(true);
    getAllReports()
      .then(setAllReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(t('common.localeForDate'), { dateStyle: 'long' }).format(date);
  };
  
  const searchCorpus = allReports.map(report => {
    const categoryName = getCategoryNameForDisplay(report.category, t);
    const tagNames = report.tags.map(tag => t(`tags.${migrateTagIfNeeded(tag)}`)).join(' ');

    return {
      ...report,
      searchableText: [
        report.fullName,
        report.nationality,
        report.birthYear,
        report.comment,
        report.reporterCompanyName,
        categoryName,
        tagNames,
      ].filter(Boolean).join(' ').toLowerCase(),
    };
  });

  const onSubmit = async (values: SearchFormValues) => {
    setIsSearching(true);
    setHasSearched(true);
    const lowercasedQuery = values.query.toLowerCase();

    const results = searchCorpus.filter(report =>
      report.searchableText.includes(lowercasedQuery)
    );
    
    setFilteredReports(results);
    
    if (user) {
        try {
            await addSearchLog({
                userId: user.id,
                searchText: values.query,
                resultsCount: results.length,
            });
        } catch (error) {
            console.error("Failed to log search:", error);
        }
    }

    setIsSearching(false);
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("search.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("search.description")}</p>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("search.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">{t("search.queryLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("search.queryPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
                {isSearching ? t("search.loading") : t("search.searchButton")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isSearching && (
         <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isSearching && hasSearched && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">{t('search.results.title', { count: filteredReports.length })}</h2>
          {filteredReports.length === 0 ? (
             <Card className="w-full py-20 flex flex-col items-center justify-center">
                <FileWarning className="w-16 h-16 text-muted-foreground" />
                <CardTitle className="mt-6">{t('search.noResults.title')}</CardTitle>
                <CardDescription className="mt-2 max-w-md text-center">
                    {t('search.noResults.message', { query: form.getValues('query') })}
                </CardDescription>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className={`overflow-hidden ${DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'border-destructive' : ''}`}>
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">{report.fullName}</CardTitle>
                      <CardDescription>
                        {report.nationality && <Badge variant="outline" className="mr-2">{report.nationality}</Badge>}
                        {report.birthYear && <span>{t('search.results.birthYearPrefix')}{report.birthYear}</span>}
                      </CardDescription>
                    </div>
                     <div className="text-sm text-muted-foreground text-left sm:text-right">
                        <div>{t('search.results.submittedBy')}: <strong>{report.reporterCompanyName}</strong></div>
                        <div>{t('search.results.date')}: {formatDate(report.createdAt as Date)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">{t('search.results.mainCategory')}</h4>
                            <Badge>{getCategoryNameForDisplay(report.category, t)}</Badge>
                        </div>
                        {report.tags.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">{t('search.results.tags')}</h4>
                                <div className="flex flex-wrap gap-2">
                                {report.tags.map(tag => (
                                    <Badge key={tag} variant="secondary">{t(`tags.${migrateTagIfNeeded(tag)}`)}</Badge>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Separator />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2">
                            <h4 className="font-semibold mb-2">{t('search.results.comment')}</h4>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{report.comment}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">{t('search.results.attachedFile')}</h4>
                            {report.imageUrls && report.imageUrls.length > 0 ? (
                                <a href={report.imageUrls[0]} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={report.imageUrls[0]}
                                    alt={t('search.results.imageAlt', { fullName: report.fullName })}
                                    width={300}
                                    height={200}
                                    className="rounded-md object-cover border hover:opacity-80 transition-opacity"
                                />
                                </a>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">{t('search.results.noFileAttached')}</p>
                            )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!isSearching && !hasSearched && (
        <Card className="w-full py-20 flex flex-col items-center justify-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground" />
            <CardTitle className="mt-6">{t('search.title')}</CardTitle>
            <CardDescription className="mt-2">
                {t('search.initialMessage')}
            </CardDescription>
        </Card>
      )}
    </div>
  );
}
