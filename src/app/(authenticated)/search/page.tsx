"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Frown, FileText, ExternalLink, UserSearch } from "lucide-react";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import { getAllReports } from "@/lib/storage";
import { getCategoryNameForDisplay, cn } from "@/lib/utils";
import type { Report } from "@/types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { logSearchActivity } from "./actions";
import { LiveActivityFeed } from "@/components/shared/live-activity-feed";
import { DriverSearchStats } from "@/components/search/driver-search-stats";

export default function SearchPage() {
    const { t, locale } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchResults, setSearchResults] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentQuery, setCurrentQuery] = useState("");

    const form = useForm<SearchFormValues>({
        resolver: zodResolver(SearchSchema),
        defaultValues: { query: "" },
    });

    const isImageUrl = (url: string) => {
        if (!url) return false;
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
    }

    const onSubmit = async (values: SearchFormValues) => {
        setIsLoading(true);
        setHasSearched(true);
        setCurrentQuery(values.query);
    
        try {
            const allReports = await getAllReports();
            const filteredReports = allReports.filter(report => {
                if (!report.fullName) return false;
                if (report.status === 'deleted' || report.status === 'pending_delete') return false;
                const query = values.query.toLowerCase().trim();
                const fullName = (report.fullName || "").toString().toLowerCase();
                return fullName.includes(query);
            });
    
            setSearchResults(filteredReports);

            if (user) {
              if (filteredReports.length > 0) {
                // Log the name from the first found report
                const foundReport = filteredReports[0];
                const nameParts = (foundReport.fullName || '').trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ');
                await logSearchActivity({ firstName, lastName, userId: user.id });
              } else {
                // Log the raw user input if nothing was found
                const nameParts = values.query.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ');
                await logSearchActivity({ firstName, lastName, userId: user.id });
              }
            }

        } catch (error: any) {
            console.error("Error during search:", error);
            toast({
                variant: "destructive",
                title: "Klaida",
                description: "Nepavyko gauti duomenų.",
            });
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper to get names for stats component
    const getNames = (fullName: string): { firstName: string, lastName: string } => {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");
        return { firstName, lastName };
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <UserSearch className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t("search.title")}</CardTitle>
                            <CardDescription>{t("search.description")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3 mb-8">
                            <div className="flex items-center gap-2">
                                <div className="flex-grow">
                                     <FormField
                                        control={form.control}
                                        name="query"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                                        <Input placeholder={t('search.queryPlaceholder')} {...field} className="pl-12 h-12 text-base" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="pl-4" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading} className="h-12 px-6">
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                    <span className="hidden sm:inline ml-2">{t('search.searchButton')}</span>
                                </Button>
                            </div>
                        </form>
                    </Form>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {isLoading && (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <Card key={i}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <Skeleton className="h-8 w-48 mb-2" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                    <Skeleton className="h-6 w-24" />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-5/6" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {!isLoading && hasSearched && searchResults.length === 0 && (
                                (() => {
                                    const { firstName, lastName } = getNames(currentQuery);
                                    return (
                                        <Card className="text-center py-10">
                                            <CardHeader className="pb-4">
                                                <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <CardTitle className="mt-4">{t('search.noResults.title')}</CardTitle>
                                                <CardDescription>{t('search.noResults.message', { query: currentQuery })}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <DriverSearchStats firstName={firstName} lastName={lastName} />
                                            </CardContent>
                                        </Card>
                                    );
                                })()
                            )}

                            {!isLoading && hasSearched && searchResults.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-muted-foreground">{t('search.results.title', { count: searchResults.length })}</h3>
                                    {searchResults.map((report) => {
                                        const { firstName, lastName } = getNames(report.fullName);
                                        return (
                                            <Card key={report.id} className={cn(
                                                "overflow-hidden transition-shadow duration-300",
                                                DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) 
                                                    ? "shadow-glow-destructive" 
                                                    : "hover:shadow-glow-primary"
                                            )}>
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
                                                    
                                                    <DriverSearchStats firstName={firstName} lastName={lastName} />
                                                    
                                                    {report.tags && report.tags.length > 0 && (
                                                      <div className="pt-4 border-t">
                                                        <h4 className="font-semibold text-sm mb-2">Žymos</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {report.tags.map(tag => <Badge key={tag} variant="outline">{t(`tags.${tag}`)}</Badge>)}
                                                        </div>
                                                      </div>
                                                    )}
                                                    <div className="pt-4 border-t">
                                                        <h4 className="font-semibold text-sm mb-1">{t('search.results.comment')}</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.comment}</p>
                                                    </div>

                                                    {report.imageUrl && (
                                                        <div className="pt-4 border-t">
                                                            <h4 className="font-semibold text-sm mb-2">{t('search.results.attachedFile')}</h4>
                                                            
                                                            {isImageUrl(report.imageUrl) ? (
                                                                <a href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative h-64 w-full md:w-96 rounded-md overflow-hidden border group">
                                                                    <Image 
                                                                        src={report.imageUrl} 
                                                                        alt="Attachment" 
                                                                        fill
                                                                        style={{objectFit:'cover'}}
                                                                        data-ai-hint={report.dataAiHint || ''}
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <ExternalLink className="text-white h-8 w-8" />
                                                                    </div>
                                                                </a>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    <a 
                                                                        href={report.imageUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors w-full md:w-96"
                                                                    >
                                                                        <div className="p-2 bg-red-100 rounded-md">
                                                                            <FileText className="h-6 w-6 text-red-600" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-medium">Dokumentas (PDF)</span>
                                                                            <span className="text-xs text-muted-foreground">Spauskite, kad peržiūrėtumėte</span>
                                                                        </div>
                                                                        <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="text-xs text-muted-foreground pt-4 border-t mt-4 flex justify-between">
                                                        <span>{t('search.results.submittedBy')}: <strong>{report.reporterCompanyName}</strong></span>
                                                        <span>{t('search.results.date')}: <strong>{new Date(report.createdAt).toLocaleDateString(locale)}</strong></span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                             {!isLoading && !hasSearched && (
                                <div className="text-center py-10 border rounded-lg">
                                    <p className="text-muted-foreground">{t('search.initialMessage')}</p>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1">
                            <LiveActivityFeed />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
