
"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReportSchema, type ReportFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { countries, detailedReportCategories } from "@/lib/constants";
import * as storage from '@/lib/storage';
import { Loader2, FilePlus2, Wand2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { categorizeReport } from "@/ai/flows/categorize-report-flow";
import type { Report } from '@/types';

export default function AddReportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, startCategorizing] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      fullName: "",
      nationality: undefined,
      birthYear: undefined,
      category: "",
      tags: [],
      comment: "",
      image: undefined,
    },
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    form.setValue("category", categoryId);
    form.setValue("tags", []); // Reset tags when category changes
  };

  const handleAiCategorize = () => {
    const comment = form.getValues("comment");
    if (!comment || comment.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Komentaras per trumpas',
        description: 'Įveskite bent 10 simbolių komentarą, kad AI galėtų jį išanalizuoti.',
      });
      return;
    }
    
    startCategorizing(async () => {
      try {
        const result = await categorizeReport({ comment });
        if (result) {
          form.setValue('category', result.categoryId, { shouldValidate: true });
          handleCategoryChange(result.categoryId);
          
          // Use a timeout to ensure state has updated before setting tags
          setTimeout(() => {
            form.setValue('tags', result.suggestedTags, { shouldValidate: true });
          }, 50);

          toast({
            title: 'AI Analizė Sėkminga',
            description: 'Kategorija ir žymos buvo parinktos automatiškai.',
          });
        }
      } catch (error) {
        console.error("AI categorization failed:", error);
        toast({
          variant: 'destructive',
          title: 'AI Analizės Klaida',
          description: 'Nepavyko automatiškai parinkti kategorijos. Pasirinkite rankiniu būdu.',
        });
      }
    });
  };

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: t('reports.add.toast.notLoggedIn.title'),
        description: t('reports.add.toast.notLoggedIn.description'),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      let dataAiHint: string | null = null;

      // Jei yra failas – įkeliame į Storage
      if (fileToUpload) {
        const uploadResult = await storage.uploadReportImage(fileToUpload);
        imageUrl = uploadResult.url;
        dataAiHint = uploadResult.dataAiHint;
      }

      // Pagrindiniai (privalomi) laukai
      const reportData: any = {
        reporterId: user.id,
        reporterCompanyName: user.companyName ?? '',
        fullName: values.fullName,
        nationality: values.nationality,
        category: values.category,
        tags: values.tags || [],
        comment: values.comment,
      };

      // Neprivalomi laukai – pridedami tik jei turi reikšmę
      if (values.birthYear) {
        reportData.birthYear = Number(values.birthYear);
      }
      if (imageUrl) {
        reportData.imageUrl = imageUrl;
      }
      if (dataAiHint) {
        reportData.dataAiHint = dataAiHint;
      }

      console.log('Report data before save:', reportData);

      await storage.addReport(reportData as Omit<Report, 'id' | 'createdAt' | 'deletedAt'>);

      toast({
        title: t('reports.add.toast.success.title'),
        description: t('reports.add.toast.success.description', { fullName: values.fullName }),
      });

      router.push('/reports/history');
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({
        variant: 'destructive',
        title: 'Klaida',
        description: 'Nepavyko pateikti įrašo. Bandykite dar kartą.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentCategoryDetails = detailedReportCategories.find(c => c.id === selectedCategory);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <FilePlus2 className="mr-3 h-7 w-7 text-primary" />
            {t('reports.add.title')}
          </CardTitle>
          <CardDescription>{t('reports.add.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reports.add.form.fullName.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('reports.add.form.fullName.placeholder')} {...field} />
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
                      <FormLabel>{t('reports.add.form.nationality.label')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('reports.add.form.nationality.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.value} value={country.value}>
                              {t('countries.' + country.value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reports.add.form.birthYear.label')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t('reports.add.form.birthYear.placeholder')} 
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        value={field.value === undefined ? '' : field.value}
                      />
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
                    <FormLabel>{t('reports.add.form.comment.label')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('reports.add.form.comment.placeholder')} {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <Button 
                type="button" 
                variant="outline"
                onClick={handleAiCategorize} 
                disabled={isCategorizing}>
                {isCategorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Pasiūlyti kategoriją pagal komentarą (AI)
              </Button>


              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reports.add.form.category.label')}</FormLabel>
                    <Select onValueChange={handleCategoryChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.add.form.category.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detailedReportCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{t(cat.nameKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     {field.value === 'legal_reputation' && (
                      <FormDescription className="text-amber-700 dark:text-amber-500 text-xs mt-2">
                        {t('reports.add.form.category.legalReputationNote')}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {currentCategoryDetails && currentCategoryDetails.tags.length > 0 && (
                <FormItem>
                  <FormLabel>{t('reports.add.form.tags.label')}</FormLabel>
                  <FormDescription>{t('reports.add.form.tags.description')}</FormDescription>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {currentCategoryDetails.tags.map((tagKey: string) => (
                      <FormField
                        key={tagKey}
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tagKey)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), tagKey])
                                    : field.onChange(field.value?.filter(value => value !== tagKey));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{t('tags.' + tagKey)}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
              
              <Controller
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>{t('reports.add.form.image.label')}</FormLabel>
                         <FormControl>
                             <div className="relative">
                                <Input 
                                    type="file" 
                                    accept="image/jpeg,image/png,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFileToUpload(file);
                                            setFileName(file.name);
                                            onChange(file);
                                        }
                                    }}
                                    className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary/10 file:text-primary
                                      hover:file:bg-primary/20"
                                    {...rest}
                                />
                             </div>
                        </FormControl>
                        {fileName && <p className="text-sm text-muted-foreground mt-2">Pasirinktas failas: {fileName}</p>}
                        <FormDescription>{t('reports.add.form.image.description')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting || isCategorizing} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('reports.add.form.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
