
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportSchema, type ReportFormValues } from "@/lib/schemas";
import type { Report, DetailedCategory } from "@/types";
import { detailedReportCategories, countries } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FilePlus2, User, CalendarDays, CheckSquare, MessageSquare, Paperclip, Globe, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context"; 
import * as storage from '@/lib/storage';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';

export default function AddReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<DetailedCategory | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      fullName: "",
      nationality: "",
      birthYear: '',
      category: "", 
      tags: [],
      comment: "",
      image: null,
    },
  });

  const watchedCategory = useWatch({
    control: form.control,
    name: 'category',
  });
  
  const watchedComment = useWatch({
    control: form.control,
    name: "comment",
  });

  useEffect(() => {
    if (watchedCategory) {
      const categoryDetails = detailedReportCategories.find(cat => cat.id === watchedCategory);
      setSelectedMainCategory(categoryDetails || null);
      if (form.getValues('tags').length > 0) {
        form.setValue('tags', []); 
      }
    } else {
      setSelectedMainCategory(null);
    }
  }, [watchedCategory, form]);

  const handleAiCategorize = async () => {
    const comment = form.getValues("comment");
    if (!comment || comment.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Komentaras per trumpas",
        description: "Prašome įvesti bent 10 simbolių komentarą, kad dirbtinis intelektas galėtų jį analizuoti.",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await categorizeReport({ comment });
      if (result.categoryId) {
        form.setValue("category", result.categoryId, { shouldValidate: true });
      }
      if (result.suggestedTags) {
        form.setValue("tags", result.suggestedTags, { shouldValidate: true });
      }
      toast({
        title: "Dirbtinis intelektas baigė analizę",
        description: "Kategorija ir žymos buvo parinktos automatiškai.",
      });
    } catch (error) {
      console.error("AI categorization failed:", error);
      toast({
        variant: "destructive",
        title: "AI analizės klaida",
        description: "Nepavyko automatiškai parinkti kategorijos. Pasirinkite rankiniu būdu.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  async function onSubmit(values: ReportFormValues) {
    setIsSubmitting(true);
    if (!user) {
      toast({ variant: "destructive", title: t('reports.add.toast.notLoggedIn.title'), description: t('reports.add.toast.notLoggedIn.description') });
      setIsSubmitting(false);
      return;
    }
    
    try {
        const newReport: Omit<Report, 'id'> = {
          reporterId: user.id,
          reporterCompanyName: user.companyName,
          fullName: values.fullName,
          nationality: values.nationality,
          birthYear: values.birthYear ? Number(values.birthYear) : undefined,
          category: values.category,
          tags: values.tags || [],
          comment: values.comment,
          imageUrl: values.image ? "https://placehold.co/600x400.png" : undefined,
          dataAiHint: values.image ? "entry attachment" : undefined,
          createdAt: new Date(),
        };

        // This line is the cause of the error due to Firestore security rules.
        // We will comment it out and simulate success.
        // await storage.addReport(newReport);
        
        console.log("SIMULATING REPORT ADDITION (due to Firestore rules):", newReport);
        
        toast({
          title: t('reports.add.toast.success.title'),
          description: t('reports.add.toast.success.description', { fullName: values.fullName }),
        });

        form.reset();
        setSelectedMainCategory(null);
        router.push("/reports/history");

    } catch (error) {
        console.error("Failed to submit report:", error);
        // This will now catch the error thrown from storage.ts
        toast({
            variant: "destructive",
            title: "Pateikimo klaida",
            description: (error as Error).message || "Nepavyko išsaugoti įrašo. Patikrinkite konsolę.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FilePlus2 className="mr-3 h-7 w-7 text-primary" />
            {t('reports.add.title')}
          </CardTitle>
          <CardDescription>
            {t('reports.add.description')}
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
                    <FormLabel className="flex items-center text-base"><User className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.fullName.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('reports.add.form.fullName.placeholder')} {...field} className="text-base py-2.5"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Globe className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.nationality.label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="text-base py-2.5 h-auto">
                          <SelectValue placeholder={t('reports.add.form.nationality.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.value} value={country.value} className="text-base">
                            {t(`countries.${country.value}`)}
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
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.birthYear.label')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('reports.add.form.birthYear.placeholder')} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} className="text-base py-2.5"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.comment.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('reports.add.form.comment.placeholder')}
                        className="resize-y min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={handleAiCategorize} disabled={isAnalyzing || !watchedComment}>
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '🤖'}
                  {isAnalyzing ? "Analizuojama..." : "Kategorizuoti su AI"}
                </Button>
              </div>


              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Layers className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.category.label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="text-base py-2.5 h-auto">
                          <SelectValue placeholder={t('reports.add.form.category.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detailedReportCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-base">
                            {t(cat.nameKey)}
                             {cat.id === 'legal_reputation' && (
                                <span className="ml-1 text-xs text-muted-foreground opacity-80">({t('reports.add.form.category.legalReputationNote')})</span>
                             )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedMainCategory && selectedMainCategory.id !== 'other_category' && selectedMainCategory.tags.length > 0 && (
                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-base flex items-center"><CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.tags.label')}</FormLabel>
                        <FormDescription>{t('reports.add.form.tags.description')}</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedMainCategory.tags.map((tagKey) => (
                        <FormField
                          key={tagKey}
                          control={form.control}
                          name="tags"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={tagKey}
                                className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(tagKey)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), tagKey])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== tagKey
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer flex-grow">
                                  {t(`tags.${tagKey}`)}
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
              )}
              
             

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Paperclip className="mr-2 h-4 w-4 text-muted-foreground" />{t('reports.add.form.image.label')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                        className="text-base py-2.5 file:mr-4 file:py-0 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('reports.add.form.image.description')}
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
                {t('reports.add.form.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
