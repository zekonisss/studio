
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportSchema, type ReportFormValues } from "@/lib/schemas";
import { reportCategories, reportTags, ReportCategory, ReportTag, Report } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FilePlus2, User, CalendarDays, Tag, MessageSquare, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

const LOCAL_STORAGE_REPORTS_KEY = 'driverShieldReports';

function getReportsFromLocalStorage(): Report[] {
  if (typeof window !== 'undefined') {
    const reportsJSON = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    if (reportsJSON) {
      return JSON.parse(reportsJSON).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt), // Ensure createdAt is a Date object
      }));
    }
  }
  return [];
}

function saveReportsToLocalStorage(reports: Report[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  }
}

export default function AddReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      fullName: "",
      birthYear: undefined,
      category: "",
      tags: [],
      comment: "",
      image: null,
    },
  });

  async function onSubmit(values: ReportFormValues) {
    setIsSubmitting(true);
    if (!user) {
      toast({ variant: "destructive", title: "Klaida", description: "Turite būti prisijungęs, kad galėtumėte pateikti pranešimą." });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Keep short delay for feedback
    
    const allReports = getReportsFromLocalStorage();
    const newReport: Report = {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      reporterId: user.id,
      reporterCompanyName: user.companyName,
      fullName: values.fullName,
      birthYear: values.birthYear && values.birthYear !== '' ? Number(values.birthYear) : undefined,
      category: values.category,
      tags: values.tags || [],
      comment: values.comment,
      // imageUrl: not storing image in localStorage for this demo
      createdAt: new Date(),
    };

    allReports.push(newReport);
    saveReportsToLocalStorage(allReports);
    
    toast({
      title: "Pranešimas Sėkmingai Pateiktas!",
      description: `Pranešimas apie ${values.fullName} buvo įrašytas į naršyklės atmintį.`,
    });
    form.reset();
    setIsSubmitting(false);
    router.push("/reports/history");
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FilePlus2 className="mr-3 h-7 w-7 text-primary" />
            Registruoti Naują Pranešimą
          </CardTitle>
          <CardDescription>
            Užpildykite žemiau esančią formą, norėdami pateikti informaciją apie vairuotojo pažeidimą ar įvykį.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><User className="mr-2 h-4 w-4 text-muted-foreground" />Vardas ir Pavardė</FormLabel>
                    <FormControl>
                      <Input placeholder="Vardenis Pavardenis" {...field} className="text-base py-2.5"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Gimimo Metai (nebūtina)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="pvz., 1990" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} className="text-base py-2.5"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Kategorija</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base py-2.5 h-auto">
                          <SelectValue placeholder="Pasirinkite kategoriją..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value} className="text-base">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Žymos (pasirinkite tinkamas)</FormLabel>
                       <FormDescription>Pasirinkite vieną ar kelias žymas, geriausiai apibūdinančias situaciją.</FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reportTags.map((tag) => (
                      <FormField
                        key={tag.value}
                        control={form.control}
                        name="tags"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={tag.value}
                              className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(tag.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), tag.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== tag.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm cursor-pointer flex-grow">
                                {tag.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />Komentaras</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Išsamiai aprašykite situaciją, pažeidimą ar įvykį..."
                        className="resize-y min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Paperclip className="mr-2 h-4 w-4 text-muted-foreground" />Pridėti Paveikslėlį ar Failą (nebūtina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                        className="text-base py-2.5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </FormControl>
                    <FormDescription>
                      Galite pridėti nuotrauką ar dokumentą (iki 5MB). Leidžiami formatai: JPG, PNG, PDF. Šioje demo versijoje failai nebus išsaugomi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-base py-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <FilePlus2 className="mr-2 h-5 w-5" />
                )}
                Pateikti Pranešimą
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
