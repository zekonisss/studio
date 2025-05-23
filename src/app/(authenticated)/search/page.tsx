"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchSchema, type SearchFormValues } from "@/lib/schemas";
import type { Report } from "@/types";
import { Loader2, Search as SearchIcon, User, CalendarDays, Tag, MessageSquare, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

// Mock data for search results
const mockReports: Report[] = [
  {
    id: "report1",
    reporterId: "user1",
    reporterCompanyName: "UAB Logistika LT",
    fullName: "Jonas Jonaitis",
    birthYear: 1985,
    category: "kuro_vagyste",
    tags: ["pasikartojantis", "pavojingas_vairavimas"],
    comment: "Vairuotojas buvo pastebėtas neteisėtai nupylinėjantis kurą iš įmonės sunkvežimio. Tai jau antras kartas per pastaruosius 6 mėnesius. Taip pat gauta informacija apie pavojingą vairavimą mieste.",
    imageUrl: "https://placehold.co/600x400.png",
    createdAt: new Date("2023-10-15T10:30:00Z"),
  },
  {
    id: "report2",
    reporterId: "user2",
    reporterCompanyName: "UAB Greiti Pervežimai",
    fullName: "Petras Petraitis",
    category: "zala_irangai",
    tags: ["rekomenduojama_patikrinti"],
    comment: "Grįžus iš reiso, pastebėta didelė žala priekabos šonui. Vairuotojas teigia nieko nepastebėjęs. Rekomenduojama atlikti nuodugnesnį tyrimą.",
    createdAt: new Date("2023-11-01T14:00:00Z"),
  },
];


export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { query: "" },
  });

  // Simulate search API call
  const handleSearch = async (values: SearchFormValues) => {
    setIsLoading(true);
    setNoResults(false);
    setSearchResults([]);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    
    const query = values.query.toLowerCase();
    const results = mockReports.filter(
      report => report.fullName.toLowerCase().includes(query) || report.id.includes(query) // Example search by name or code (id)
    );

    setSearchResults(results);
    if (results.length === 0) {
      setNoResults(true);
    }
    setIsLoading(false);
    // In a real app, you'd also log this search to /searchLogs
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
            Įveskite vairuotojo vardą, pavardę ar unikalų kodą, kad rastumėte susijusią informaciją.
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
                      <Input placeholder="Vardas Pavardė arba kodas..." {...field} className="text-base h-12"/>
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

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Ieškoma duomenų...</p>
        </div>
      )}

      {!isLoading && noResults && (
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

      {!isLoading && searchResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            Paieškos Rezultatai ({searchResults.length})
          </h2>
          <div className="space-y-6">
            {searchResults.map((report) => (
              <Card key={report.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-muted/30 p-4 border-b">
                  <CardTitle className="text-xl flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    {report.fullName}
                  </CardTitle>
                  {report.birthYear && (
                     <CardDescription className="flex items-center text-sm">
                        <CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground" />
                        Gimimo metai: {report.birthYear}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center">
                        <Tag className="mr-1.5 h-4 w-4" /> Kategorija
                      </h4>
                      <Badge variant="secondary" className="text-base py-1 px-3">{report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
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
                      <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-border shadow-sm">
                        <Image src={report.imageUrl} alt={`Vaizdas pranešimui apie ${report.fullName}`} layout="fill" objectFit="cover" data-ai-hint="incident document" />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-3 text-xs text-muted-foreground border-t">
                  <div className="flex justify-between w-full items-center">
                    <span>Pranešė: {report.reporterCompanyName || 'Privatus asmuo'}</span>
                    <span>Data: {format(report.createdAt, "yyyy-MM-dd HH:mm", { locale: lt })}</span>
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
