
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
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { countries, detailedReportCategories } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useMemo } from "react";
import { getCategoryNameForDisplay } from "@/lib/utils";
import type { Report } from "@/types";
import { addReport } from "@/lib/server/db";
import { Loader2 } from "lucide-react";
import MultiFileUpload from "@/components/MultiFileUpload";

export default function AddReportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

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

  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (selectedCategory) {
      const categoryDetails = detailedReportCategories.find(
        (cat) => cat.id === selectedCategory
      );
      setAvailableTags(categoryDetails ? categoryDetails.tags : []);
    } else {
      setAvailableTags([]);
    }
    form.setValue("tags", []); // Reset tags when category changes
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
    setIsLoading(true);
    
    try {
        const reportData: Omit<Report, "id" | "createdAt"> = {
            reporterId: user.id,
            reporterCompanyName: user.companyName,
            fullName: values.fullName,
            nationality: values.nationality,
            birthYear: values.birthYear ? Number(values.birthYear) : undefined,
            category: values.category,
            tags: values.tags || [],
            comment: values.comment,
        };

        if (uploadedImageUrls && uploadedImageUrls.length > 0) {
            reportData.imageUrls = uploadedImageUrls;
        }

        await addReport(reportData);

        toast({
            title: "Įrašas sėkmingai pateiktas!",
            description: `Įrašas apie ${values.fullName} buvo išsaugotas.`,
        });
        form.reset();
        setUploadedImageUrls([]);
    } catch (error) {
        console.error("Error submitting report:", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Nepavyko išsaugoti įrašo. Bandykite dar kartą.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const memoizedCategories = useMemo(() => detailedReportCategories.map(cat => ({
    id: cat.id,
    displayName: getCategoryNameForDisplay(cat.id, t)
  })), [t]);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("reports.add.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("reports.add.description")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.add.title")}</CardTitle>
          <CardDescription>
            {t("reports.add.form.comment.placeholder")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("reports.add.form.fullName.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("reports.add.form.fullName.placeholder")}
                          {...field}
                        />
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
                      <FormLabel>{t("reports.add.form.nationality.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("reports.add.form.nationality.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
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
                      <FormLabel>{t("reports.add.form.birthYear.label")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t("reports.add.form.birthYear.placeholder")} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
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
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("reports.add.form.category.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {memoizedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory === "legal_reputation" && (
                      <p className="text-sm text-amber-600 mt-2">
                          <b>Dėmesio:</b> Vairuotojas gali būti informuotas apie neigiamą įrašą ir reikalauti teisinio atsakymo. Būkite tikri, kad informacija yra teisinga ir galite ją pagrįsti. 
                          Rekomenduojame vengti šios kategorijos, jei neturite tvirtų įrodymų. Naudokite atsakingai.
                      </p>
                    )}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                                          ? field.onChange([
                                              ...(field.value || []),
                                              tag,
                                            ])
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

              <FormItem>
                <FormLabel>{t("reports.add.form.image.label")}</FormLabel>
                 <MultiFileUpload onUploadComplete={setUploadedImageUrls} />
                <FormDescription>
                  {t("reports.add.form.image.description")}
                </FormDescription>
                <FormMessage />
              </FormItem>

              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("reports.add.form.submitButton")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
