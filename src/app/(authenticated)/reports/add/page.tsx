"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReportSchema, type ReportFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { countries, detailedReportCategories } from "@/lib/constants";
import { getCategoryNameForDisplay } from "@/lib/utils";
import { addReport, uploadReportImage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { FilePlus2, Loader2, BrainCircuit } from "lucide-react";
// import { categorizeReport } from '@/ai/flows/categorize-report-flow';

export default function AddReportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  // const [isAiCategorizing, setIsAiCategorizing] = useTransition();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      fullName: "",
      nationality: "",
      birthYear: undefined,
      category: "",
      tags: [],
      comment: "",
      image: null,
    },
  });

  const commentValue = form.watch('comment');

  // const handleAiCategorize = useCallback(() => {
  //   if (!commentValue || commentValue.trim().length < 20) return;

  //   setIsAiCategorizing(async () => {
  //     try {
  //       const result = await categorizeReport({ comment: commentValue });
  //       if (result && result.categoryId) {
  //         form.setValue('category', result.categoryId, { shouldValidate: true });
  //         setSelectedCategory(result.categoryId); // Update selected category state
  //         if (result.suggestedTags) {
  //           form.setValue('tags', result.suggestedTags, { shouldValidate: true });
  //         }
  //       }
  //     } catch (error) {
  //       console.error("AI categorization error:", error);
  //     }
  //   });
  // }, [commentValue, form]);


  const availableTags = useMemo(() => {
    return (
      detailedReportCategories.find((cat) => cat.id === selectedCategory)
        ?.tags || []
    );
  }, [selectedCategory]);

  useEffect(() => {
    form.resetField("tags");
  }, [selectedCategory, form]);

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: t("reports.add.toast.notLoggedIn.title"),
        description: t("reports.add.toast.notLoggedIn.description"),
      });
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
        imageUrl: imageUrl,
        dataAiHint: dataAiHint,
      };

      await addReport(reportData);

      toast({
        title: t("reports.add.toast.success.title"),
        description: t("reports.add.toast.success.description", { fullName: values.fullName }),
      });
      router.push("/reports/history");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko išsaugoti įrašo. Bandykite dar kartą.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>{t("reports.add.form.fullName.label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("reports.add.form.fullName.placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>{t("reports.add.form.nationality.label")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("reports.add.form.nationality.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
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
                  <FormItem className="md:col-span-1">
                    <FormLabel>{t("reports.add.form.birthYear.label")}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t("reports.add.form.birthYear.placeholder")} {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.comment.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("reports.add.form.comment.placeholder")}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {/* <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiCategorize}
                      disabled={isAiCategorizing || !commentValue || commentValue.trim().length < 20}
                    >
                      {isAiCategorizing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BrainCircuit className="mr-2 h-4 w-4" />
                      )}
                      Kategorizuoti su AI
                    </Button>
                  </div> */}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reports.add.form.category.label")}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCategory(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("reports.add.form.category.placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {detailedReportCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getCategoryNameForDisplay(cat.id, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {availableTags.length > 0 && (
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>{t("reports.add.form.tags.label")}</FormLabel>
                      <FormDescription>
                        {t("reports.add.form.tags.description")}
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {availableTags.map((tag) => (
                        <FormField
                          key={tag}
                          control={form.control}
                          name="tags"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={tag}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(tag)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), tag])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== tag
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t(`tags.${tag}`)}
                                </FormLabel>
                              </FormItem>
                            );
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
                  <FormLabel>{t("reports.add.form.image.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        field.onChange(file);
                        setImageFile(file);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("reports.add.form.image.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
