
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
import { Search, Loader2, UserSearch, ShieldCheck, Send } from "lucide-react";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import { getAllReports } from "@/lib/storage";
import type { Report } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { logSearchActivity } from "./actions";
import { LiveActivityFeed } from "@/components/shared/live-activity-feed";
import { DriverSearchStats } from "@/components/search/driver-search-stats";
import Link from "next/link";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Label } from "@/components/ui/label";

export default function SearchPage() {
    const { t } = useLanguage();
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [searchResults, setSearchResults] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentQuery, setCurrentQuery] = useState("");

    // State for verification request form
    const [targetEmail, setTargetEmail] = useState('');
    const [targetCompany, setTargetCompany] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    const form = useForm<SearchFormValues>({
        resolver: zodResolver(SearchSchema),
        defaultValues: { query: "" },
    });

    const hasSearchCredits = user && (user.paymentStatus === 'active' || (user.paymentStatus === 'trial' && (user.searchCredits ?? 0) > 0));

    const onSubmit = async (values: SearchFormValues) => {
        setIsLoading(true);
        setHasSearched(true);
        setCurrentQuery(values.query);

        // Reset verification form on new search
        setTargetEmail('');
        setTargetCompany('');
    
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

    const handleVerificationRequest = async () => {
        if (!targetEmail || !targetCompany) {
            toast({
                variant: "destructive",
                title: "Trūksta duomenų",
                description: "Prašome užpildyti el. pašto ir įmonės laukus.",
            });
            return;
        }
        setIsRequesting(true);
        try {
            const response = await fetch('/api/checks/create-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverName: currentQuery,
                    targetEmail,
                    targetCompany,
                    requesterId: user?.id,
                }),
            });
            
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || "Serverio klaida siunčiant užklausą.");
            }
            
            if (data.debugLink) {
              console.log("LINKAS:", data.debugLink); // Show in Browser Console (F12)
              alert(`DEBUG: Laiškas išsiųstas! Nuoroda: \n${data.debugLink}`); // Show Popup
            }
    
            toast({
                title: "Užklausa išsiųsta!",
                description: "Buvęs darbdavys gavo patikros nuorodą.",
            });
    
            setTargetEmail('');
            setTargetCompany('');
    
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Klaida",
                description: error.message || "Nepavyko išsiųsti užklausos.",
            });
        } finally {
            setIsRequesting(false);
        }
    };

    const { firstName, lastName } = getNames(currentQuery);

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
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3 mb-10">
                            <fieldset disabled={isLoading || !hasSearchCredits}>
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
                                        disabled={isLoading || !hasSearchCredits} 
                                        className="h-14 px-8 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all"
                                    >
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                        <span className="hidden sm:inline ml-2">{t('search.searchButton')}</span>
                                    </Button>
                                </div>
                            </fieldset>
                        </form>
                    </Form>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-6">
                            
                            {isLoading && (
                                <div className="space-y-4">
                                    <Skeleton className="h-24 w-full" />
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

                            {!isLoading && hasSearched && (
                                <>
                                    <div className="max-w-md">
                                        <DriverSearchStats firstName={firstName} lastName={lastName} />
                                    </div>
                                    
                                    {searchResults.length === 0 ? (
                                        <Card className="text-center py-12">
                                            <CardHeader>
                                                <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                    <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-500" />
                                                </div>
                                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                                    {t('search.noResults.title')}
                                                </CardTitle>
                                                <CardDescription className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                    Pagal užklausą <span className="font-semibold text-foreground">"{currentQuery}"</span> įrašų nerasta.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="mt-4 pt-6 border-t border-slate-200 dark:border-slate-800/50 w-full max-w-lg mx-auto">
                                                    <h4 className="font-semibold text-foreground">Neturite įrašo? Išsiųskite patikros užklausą</h4>
                                                    <p className="text-sm text-muted-foreground mt-1 mb-4">Nurodykite buvusio darbdavio el. paštą ir mes išsiųsime saugią nuorodą atsiliepimui pateikti.</p>
                                                    <div className="space-y-4 text-left">
                                                        <div>
                                                            <Label htmlFor="targetEmail">Buvusio Darbdavio El. Paštas</Label>
                                                            <Input
                                                                id="targetEmail"
                                                                placeholder="darbdavys@imone.lt"
                                                                value={targetEmail}
                                                                onChange={(e) => setTargetEmail(e.target.value)}
                                                                disabled={isRequesting}
                                                            />
                                                        </div>
                                                         <div>
                                                            <Label htmlFor="targetCompany">Įmonės Pavadinimas</Label>
                                                            <Input
                                                                id="targetCompany"
                                                                placeholder="UAB Pavyzdys"
                                                                value={targetCompany}
                                                                onChange={(e) => setTargetCompany(e.target.value)}
                                                                disabled={isRequesting}
                                                            />
                                                        </div>
                                                        <Button className="w-full" onClick={handleVerificationRequest} disabled={isRequesting || !targetEmail || !targetCompany}>
                                                            {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                            Siųsti Užklausą
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in-from-bottom-4 duration-500">
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
                                </>
                            )}

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

                        <div className="lg:col-span-1">
                            <LiveActivityFeed />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


