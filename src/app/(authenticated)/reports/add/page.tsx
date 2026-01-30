'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReportSchema, type ReportFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback, useTransition, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { countries, detailedReportCategories } from "@/lib/constants";
import { getCategoryNameForDisplay, cn } from "@/lib/utils";
import { addReport, uploadReportImage } from "@/lib/storage";
import { Loader2, BrainCircuit, FilePlus2, UploadCloud, X } from "lucide-react";
import { categorizeReportAction } from "./actions";

export default function AddReportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAiCategorizing, startTransition] = useTransition();

  const [isAiHighlight, setIsAiHighlight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      fullName: "",
      nationality: "",
      birthYear: undefined,
      category: "",
      tags: [],
      comment: "",
      image: null
    },
  });

  const commentValue = form.watch('comment');

  const handleAiCategorize = useCallback(() => {
    if (!commentValue || commentValue.trim().length < 20) return;

    startTransition(async () => {
      try {
        const result = await categorizeReportAction(commentValue);
        if (result?.categoryId) {
          form.setValue('category', result.categoryId, { shouldValidate: true });
          setSelectedCategory(result.categoryId);
          if (result.suggestedTags) {
            form.setValue('tags', result.suggestedTags, { shouldValidate: true });
          }
          
          setIsAiHighlight(true);
          setTimeout(() => setIsAiHighlight(false), 2000);
        }
      } catch (e) {
        console.error("AI error:", e);
      }
    });
  }, [commentValue, form]);

  const availableTags = useMemo(() =>
    detailedReportCategories.find(c => c.id === selectedCategory)?.tags || [],
    [selectedCategory]
  );

  useEffect(() => {
    form.resetField("tags");
  }, [selectedCategory, form]);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      form.setValue('image', file, { shouldValidate: true });
      setImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        handleFileSelect(droppedFile);
    }
  };

  const handleRemoveImage = () => {
    form.setValue('image', null, { shouldValidate: true });
    setImageFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: t("reports.add.toast.notLoggedIn.title"), description: t("reports.add.toast.notLoggedIn.description") });
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      let dataAiHint: string | null = null;

      if (imageFile) {
        const uploadResult = await uploadReportImage(imageFile);
        imageUrl = uploadResult.url;
        dataAiHint = uploadResult.dataAiHint;
      }

      await addReport({
        reporterId: user.id,
        reporterCompanyName: user.companyName,
        fullName: values.fullName,
        nationality: values.nationality,
        birthYear: values.birthYear ? Number(values.birthYear) : null,
        category: values.category,
        tags: values.tags || [],
        comment: values.comment,
        imageUrl,
        dataAiHint
      });

      toast({ title: t("reports.add.toast.success.title"), description: t("reports.add.toast.success.description", { fullName: values.fullName }) });
      router.push("/authenticated/reports/history");
    } catch (e) {
      toast({ variant: "destructive", title: "Klaida", description: "Nepavyko išsaugoti įrašo." });
      console.error(e);
    } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <FilePlus2 className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>{t("reports.add.title")}</CardTitle>
            <CardDescription>{t("reports.add.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.fullName.label")}</FormLabel>
                  <FormControl><Input placeholder={t("reports.add.form.fullName.placeholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nationality" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.nationality.label")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("reports.add.form.nationality.placeholder")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.value} value={c.value}>{t(`countries.${c.value}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="birthYear" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.birthYear.label")}</FormLabel>
                  <FormControl><Input type="number" placeholder={t("reports.add.form.birthYear.placeholder")} {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reports.add.form.comment.label")}</FormLabel>
                <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                <FormMessage />
                <div className="flex justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleAiCategorize} disabled={isAiCategorizing || !commentValue || commentValue.trim().length < 20}>
                    {isAiCategorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Kategorizuoti su AI
                  </Button>
                </div>
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reports.add.form.category.label")}</FormLabel>
                <Select value={field.value} onValueChange={v => { field.onChange(v); setSelectedCategory(v); }}>
                  <FormControl>
                    <SelectTrigger className={cn("transition-all", isAiHighlight && "ring-2 ring-primary bg-primary/5")}>
                      <SelectValue placeholder={t("reports.add.form.category.placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {detailedReportCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{getCategoryNameForDisplay(cat.id, t)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {availableTags.length > 0 && (
              <FormField control={form.control} name="tags" render={() => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.tags.label")}</FormLabel>
                  <FormDescription>{t("reports.add.form.tags.description")}</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableTags.map(tag => (
                      <FormField key={tag} control={form.control} name="tags" render={({ field }) => (
                        <FormItem className="flex items-start space-x-3">
                          <FormControl>
                            <Checkbox checked={field.value?.includes(tag)} onCheckedChange={checked => {
                              const newValue = checked ? [...(field.value || []), tag] : field.value?.filter(v => v !== tag);
                              field.onChange(newValue);
                            }} />
                          </FormControl>
                          <FormLabel className="font-normal">{t(`tags.${tag}`)}</FormLabel>
                        </FormItem>
                      )} />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="space-y-2">
              <FormLabel>{t("reports.add.form.image.label")}</FormLabel>
              <div 
                  className={cn(
                      "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent/50",
                      imageFile && "border-primary bg-primary/5"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
              >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-center font-medium">
                      {imageFile ? imageFile.name : 'Tempkite failą čia arba paspauskite'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                      {t("reports.add.form.image.description")}
                  </p>
                  <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, application/pdf"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  {imageFile && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                          }}
                      >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Pašalinti</span>
                      </Button>
                  )}
              </div>
              <FormMessage>{form.formState.errors.image && String(form.formState.errors.image.message)}</FormMessage>
            </div>


            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("reports.add.form.submitButton")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
