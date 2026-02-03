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
import { Search, Loader2, UserSearch, ShieldCheck, ShieldAlert } from "lucide-react";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import { getAllReports } from "@/lib/storage";
import type { Report } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { logSearchActivity } from "./actions";
import { LiveActivityFeed } from "@/components/shared/live-activity-feed";
import { DriverSearchStats } from "@/components/search/driver-search-stats";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
// NAUJAS KOMPONENTAS
import { SearchResultCard } from "@/components/search/SearchResultCard";

export default function SearchPage() {
    const { t } = useLanguage();
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
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
             if (user) {
                const nameParts = values.query.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ');

                const logResult = await logSearchActivity({ 
                    firstName, 
                    lastName, 
                    userId: user.id 
                });

                if (!logResult.success) {
                    if (logResult.error === "out_of_credits") {
                        toast({
                            variant: "destructive",
                            title: "Baigėsi paieškos kreditai!",
                            description: "Norėdami tęsti paiešką, aktyvuokite pilną prenumeratą.",
                        });
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Klaida",
                            description: "Nepavyko patikrinti kreditų. Bandykite vėliau.",
                        });
                    }
                    setIsLoading(false);
                    return; 
                }
                await refreshUser();
            }

            const allReports = await getAllReports();
            const filteredReports = allReports.filter(report => {
                if (!report.fullName) return false;
                if (report.status === 'deleted' || report.status === 'pending_delete') return false;
                const query = values.query.toLowerCase().trim();
                const fullName = (report.fullName || "").toString().toLowerCase();
                return fullName.includes(query);
            });
    
            setSearchResults(filteredReports);

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
    
    const getNames = (fullName: string): { firstName: string, lastName: string } => {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");
        return { firstName, lastName };
    };

    const hasSearchCredits = user && (user.paymentStatus === 'active' || (user.paymentStatus === 'trial' && (user.searchCredits ?? 0) > 0));

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <UserSearch className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">{t("search.title")}</CardTitle>
                            <CardDescription className="text-base mt-1">{t("search.description")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    
                    {hasSearchCredits ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3 mb-10">
                                <fieldset disabled={isLoading}>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-grow relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                            <FormField
                                                control={form.control}
                                                name="query"
                                                render={({ field }) => (
                                                    <FormItem className="relative bg-background rounded-lg">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                <Input 
                                                                    placeholder={t('search.queryPlaceholder')} 
                                                                    {...field} 
                                                                    className="pl-12 h-14 text-lg shadow-sm border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-primary/50" 
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="pl-4" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading} 
                                            className="h-14 px-8 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all"
                                        >
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                            <span className="hidden sm:inline ml-2">{t('search.searchButton')}</span>
                                        </Button>
                                    </div>
                                </fieldset>
                            </form>
                        </Form>
                    ) : (
                        user?.paymentStatus === 'trial' && (
                            <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Paieškos kreditai baigėsi</AlertTitle>
                                <AlertDescription>
                                    Jūs išnaudojote nemokamų paieškų limitą. Norėdami tęsti, prašome{" "}
                                    <Link href="/account?tab=payment" className="font-semibold underline hover:text-white">aktyvuoti prenumeratą</Link>.
                                </AlertDescription>
                            </Alert>
                        )
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* LOADING STATE */}
                            {isLoading && (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-8 w-48" />
                                                    <div className="flex gap-2">
                                                        <Skeleton className="h-5 w-24" />
                                                        <Skeleton className="h-5 w-24" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                            </div>
                                            <Skeleton className="h-20 w-full rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* NO RESULTS STATE */}
                            {!isLoading && hasSearched && searchResults.length === 0 && (() => {
                                const { firstName, lastName } = getNames(currentQuery);
                                return (
                                    <div className="text-center py-12 border rounded-xl bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20 backdrop-blur-sm">
                                        <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-inner">
                                            <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-500" />
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                            {t('search.noResults.title') || "Švaru!"}
                                        </h3>
                                        
                                        <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
                                            Pagal užklausą <span className="font-semibold text-foreground">"{currentQuery}"</span> įrašų nerasta.
                                        </p>
                                        
                                        <div className="max-w-md mx-auto mt-8">
                                             <DriverSearchStats firstName={firstName} lastName={lastName} />
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-green-200/50 dark:border-green-900/30">
                                            <p className="text-sm text-muted-foreground">
                                                Turite informacijos apie šį asmenį? <Link href="/reports/add" className="font-medium underline text-primary hover:text-primary/80 transition-colors">Sukurti naują įrašą</Link>.
                                            </p>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* RESULTS LIST */}
                            {!isLoading && hasSearched && searchResults.length > 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                            {t('search.results.title', { count: searchResults.length })}
                                        </h3>
                                        <span className="text-sm text-muted-foreground">
                                            Rasti {searchResults.length} įrašai
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {searchResults.map((report) => (
                                            <SearchResultCard key={report.id} report={report} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INITIAL STATE */}
                             {!isLoading && !hasSearched && (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                                    <UserSearch className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Pradėkite paiešką</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                        Įveskite vardą, pavardę arba asmens kodą, kad patikrintumėte duomenų bazę.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR */}
                        <div className="lg:col-span-1">
                            <LiveActivityFeed />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
