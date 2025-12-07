
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Frown } from "lucide-react";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import { getAllReports, addSearchLog } from "@/lib/storage";
import { getCategoryNameForDisplay } from "@/lib/utils";
import type { Report } from "@/types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";

export default function SearchPage() {
    const { t, locale } = useLanguage();
    const { user } = useAuth();
    const [searchResults, setSearchResults] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentQuery, setCurrentQuery] = useState("");

    const form = useForm<SearchFormValues>({
        resolver: zodResolver(SearchSchema),
        defaultValues: { query: "" },
    });

    const onSubmit = async (values: SearchFormValues) => {
        setIsLoading(true);
        setHasSearched(true);
        setCurrentQuery(values.query);

        try {
            const allReports = await getAllReports();
            const query = values.query.toLowerCase();
            
            const filteredReports = allReports.filter(report => {
                 if (report.deletedAt) return false;

                const categoryName = getCategoryNameForDisplay(report.category, t).toLowerCase();
                const tags = report.tags.map(tag => t(`tags.${tag}`).toLowerCase());
                
                return (
                    report.fullName.toLowerCase().includes(query) ||
                    (report.nationality && t(`countries.${report.nationality}`).toLowerCase().includes(query)) ||
                    categoryName.includes(query) ||
                    tags.some(tag => tag.includes(query)) ||
                    report.comment.toLowerCase().includes(query)
                );
            });

            setSearchResults(filteredReports);

            if (user) {
                await addSearchLog({
                    userId: user.id,
                    searchText: values.query,
                    resultsCount: filteredReports.length
                });
            }

        } catch (error) {
            console.error("Error during search:", error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Search className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('search.title')}</CardTitle>
                            <CardDescription>{t('search.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                            <FormField
                                control={form.control}
                                name="query"
                                render={({ field }) => (
                                    <FormItem className="flex-grow w-full">
                                        <FormLabel className="sr-only">{t('search.queryLabel')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('search.queryPlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                {t('search.searchButton')}
                            </Button>
                        </form>
                    </Form>
                    
                    <div>
                        {isLoading && (
                            <div className="text-center py-10">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">{t('search.loading')}</p>
                            </div>
                        )}

                        {!isLoading && !hasSearched && (
                            <p className="text-center text-muted-foreground py-10">{t('search.initialMessage')}</p>
                        )}
                        
                        {!isLoading && hasSearched && searchResults.length === 0 && (
                            <div className="text-center py-10">
                                <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-lg font-semibold">{t('search.noResults.title')}</p>
                                <p className="mt-2 text-muted-foreground">{t('search.noResults.message', { query: currentQuery })}</p>
                            </div>
                        )}

                        {!isLoading && hasSearched && searchResults.length > 0 && (
                             <div className="space-y-4">
                                <h3 className="text-xl font-semibold">{t('search.results.title', { count: searchResults.length })}</h3>
                                {searchResults.map((report) => (
                                    <Card key={report.id} className={`overflow-hidden ${DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'border-destructive/40' : ''}`}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <CardTitle className="text-2xl">{report.fullName}</CardTitle>
                                                    <CardDescription>
                                                        {report.nationality && `${t(`countries.${report.nationality}`)}`}
                                                        {report.nationality && report.birthYear && ', '}
                                                        {report.birthYear && `${t('search.results.birthYearPrefix')}${report.birthYear}`}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'}>{getCategoryNameForDisplay(report.category, t)}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {report.tags && report.tags.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">{t('search.results.tags')}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {report.tags.map(tag => <Badge key={tag} variant="outline">{t(`tags.${tag}`)}</Badge>)}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">{t('search.results.comment')}</h4>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.comment}</p>
                                            </div>

                                            {report.imageUrl && (
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-2">{t('search.results.attachedFile')}</h4>
                                                    <div className="relative h-64 w-full md:w-96 rounded-md overflow-hidden border">
                                                      <Image 
                                                        src={report.imageUrl} 
                                                        alt={t('search.results.imageAlt', {fullName: report.fullName})} 
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                        data-ai-hint={report.dataAiHint || ''}
                                                      />
                                                    </div>
                                                </div>
                                            )}
                                             <div className="text-xs text-muted-foreground pt-4 border-t mt-4">
                                                <div className="flex justify-between items-center">
                                                    <span>{t('search.results.submittedBy')}: <strong>{report.reporterCompanyName}</strong></span>
                                                    <span>{t('search.results.date')}: <strong>{new Date(report.createdAt).toLocaleDateString(t('common.localeForDate'))}</strong></span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
