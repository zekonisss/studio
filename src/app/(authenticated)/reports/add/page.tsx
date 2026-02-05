
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
import { cn } from "@/lib/utils";
import { uploadReportImage } from "@/lib/storage";
import { Loader2, BrainCircuit, UploadCloud, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { categorizeReportAction, addReportWithCreditCheck } from "./actions";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { IncidentCategorySelector } from "@/components/reports/IncidentCategorySelector";
import { ReportGuidance } from "@/components/reports/ReportGuidance";

export default function AddReportPage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
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
          toast({ title: t("reports.add.toast.aiSuccess.title"), description: t("reports.add.toast.aiSuccess.description") });
        }
      } catch (e) {
        console.error("AI error:", e);
      }
    });
  }, [commentValue, form, toast, t]);

  const availableTags = useMemo(() =>
    detailedReportCategories.find(c => c.id === selectedCategory)?.tags || [],
    [selectedCategory]
  );

  useEffect(() => {
    const currentTags = form.getValues('tags');
    if (currentTags && currentTags.length > 0 && !isAiHighlight) {
         form.setValue("tags", []);
    }
  }, [selectedCategory, form, isAiHighlight]);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast({ variant: "destructive", title: t("common.error"), description: t("reports.add.toast.fileTooLarge") });
          return;
      }
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
    if (user.paymentStatus === 'trial' && (!user.reportCredits || user.reportCredits <= 0)) {
        toast({ variant: "destructive", title: t("reports.add.toast.noCredits.title"), description: t("reports.add.toast.noCredits.description") });
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
      
      const reportData = {
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
      };

      const result = await addReportWithCreditCheck(reportData, user.id);

      if (result.success) {
        toast({ title: t("reports.add.toast.success.title"), description: t("reports.add.toast.success.description", { fullName: values.fullName }) });
        await refreshUser(); 
        router.push("/reports/history");
      } else {
        throw new Error(result.error || t("reports.add.toast.saveError"));
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: t("common.error"), description: e.message || t("reports.add.toast.saveError") });
      console.error(e);
    } finally { setIsSubmitting(false); }
  };
  
  const canSubmit = user && (user.paymentStatus === 'active' || (user.paymentStatus === 'trial' && (user.reportCredits ?? 0) > 0));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("reports.add.title")}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                {t("reports.add.description")}
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <fieldset disabled={isSubmitting || !canSubmit} className="space-y-6">
                            
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{t("reports.add.form.driverData.title")}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="fullName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("reports.add.form.fullName.label")}</FormLabel>
                                            <FormControl><Input placeholder={t("reports.add.form.fullName.placeholder")} {...field} className="h-11" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="nationality" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("reports.add.form.nationality.label")}</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11"><SelectValue placeholder={t("reports.add.form.nationality.placeholder")} /></SelectTrigger>
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
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder={t("reports.add.form.birthYear.placeholder")}
                                                    {...field} 
                                                    className="h-11"
                                                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card className={cn("border-slate-200 dark:border-slate-800 shadow-sm transition-all", isAiHighlight && "ring-2 ring-primary border-primary")}>
                                <CardHeader>
                                    <CardTitle>{t("reports.add.form.incidentType.title")}</CardTitle>
                                    <CardDescription>{t("reports.add.form.incidentType.description")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField 
                                        control={form.control} 
                                        name="category" 
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <IncidentCategorySelector 
                                                        value={field.value} 
                                                        onChange={(val) => {
                                                            field.onChange(val);
                                                            setSelectedCategory(val);
                                                        }} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{t("reports.add.form.circumstances.title")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    
                                    <FormField control={form.control} name="comment" render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center mb-1">
                                                <FormLabel>{t("reports.add.form.comment.label")}</FormLabel>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-primary hover:text-primary hover:bg-primary/10 h-7 text-xs"
                                                    onClick={handleAiCategorize} 
                                                    disabled={isAiCategorizing || !commentValue || commentValue.trim().length < 20}
                                                >
                                                    {isAiCategorizing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <BrainCircuit className="mr-2 h-3 w-3" />}
                                                    {t("reports.add.form.aiAnalyzeButton")}
                                                </Button>
                                            </div>
                                            <FormControl><Textarea className="min-h-[140px] resize-y text-base" placeholder={t("reports.add.form.comment.label")} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {availableTags.length > 0 && (
                                        <FormField control={form.control} name="tags" render={() => (
                                            <FormItem className="animate-in fade-in slide-in-from-top-2">
                                                <FormLabel>{t("reports.add.form.tags.label")}</FormLabel>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                                    {availableTags.map(tag => (
                                                        <FormField key={tag} control={form.control} name="tags" render={({ field }) => (
                                                            <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-3 hover:bg-accent cursor-pointer transition-colors">
                                                                <FormControl>
                                                                    <Checkbox 
                                                                        checked={field.value?.includes(tag)} 
                                                                        onCheckedChange={checked => {
                                                                            const newValue = checked ? [...(field.value || []), tag] : field.value?.filter(v => v !== tag);
                                                                            field.onChange(newValue);
                                                                        }} 
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal cursor-pointer w-full text-sm">
                                                                    {t(`tags.${tag}`)}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )} />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}

                                    <div className="space-y-2 pt-2">
                                        <FormLabel>{t("reports.add.form.image.label")}</FormLabel>
                                        <div 
                                            className={cn(
                                                "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group",
                                                isDragging 
                                                    ? "border-primary bg-primary/10 scale-[1.01]" 
                                                    : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                                imageFile && "border-primary bg-primary/5"
                                            )}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {imageFile ? (
                                                <div className="flex flex-col items-center">
                                                     <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 text-green-600">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                     </div>
                                                     <p className="font-medium text-slate-900 dark:text-white">{imageFile.name}</p>
                                                     <p className="text-xs text-slate-500">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <UploadCloud className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-center font-medium text-slate-900 dark:text-white">
                                                        {t("reports.add.form.image.dragAndDrop")}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {t("reports.add.form.image.formats")}
                                                    </p>
                                                </>
                                            )}
                                            
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
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage();
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormMessage>{form.formState.errors.image && String(form.formState.errors.image.message)}</FormMessage>
                                    </div>

                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !canSubmit} 
                                    className="w-full md:w-auto text-lg h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    {t("reports.add.form.submitButton")}
                                </Button>
                            </div>

                        </fieldset>
                    </form>
                </Form>
            </div>

            <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-8">
                     <ReportGuidance category={selectedCategory} />
                </div>
            </div>
        </div>
    </div>
  );
}
