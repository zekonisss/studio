"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Copy, Loader2, Package, CheckCircle } from "lucide-react";
import { submitMerchOrder } from "./actions";
import { useLanguage } from "@/contexts/language-context";

export default function ReputationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const OrderSchema = z.object({
    recipient: z.string().min(3, { message: t('reputation.validation.recipientRequired') }),
    companyName: z.string().min(2, { message: t('reputation.validation.companyNameRequired') }),
    address: z.string().min(5, { message: t('reputation.validation.addressMin') }),
    city: z.string().min(3, { message: t('reputation.validation.cityRequired') }),
    postalCode: z.string().min(4, { message: t('reputation.validation.postalCodeRequired') }),
    phone: z.string().min(8, { message: t('reputation.validation.phoneInvalid') }),
    comment: z.string().optional(),
  });
  
  type OrderFormValues = z.infer<typeof OrderSchema>;

  const embedCode = `
<a href="https://drivercheck.lt" target="_blank" style="text-decoration:none;">
  <div style="display:inline-flex;align-items:center;gap:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;background-color:#f8fafc;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="10" cy="7" r="4"></circle>
        <path d="M10.3 15H7a4 4 0 0 0-4 4v2"></path>
        <circle cx="17" cy="17" r="3"></circle>
        <path d="m21 21-1.9-1.9"></path>
    </svg>
    <div>
        <div style="font-size:24px;font-weight:700;font-style:italic;color:#1e293b;line-height:1;">DriverCheck</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${t('reputation.badge.partnerText')}</div>
    </div>
  </div>
</a>
  `.trim();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: t('toast.reputation.codeCopied.title'),
      description: t('toast.reputation.codeCopied.description'),
    });
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      recipient: user?.contactPerson || "",
      companyName: user?.companyName || "",
      address: user?.address || "",
      city: "",
      postalCode: "",
      phone: user?.phone || "",
      comment: "",
    },
  });

  const onSubmit = async (values: OrderFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const result = await submitMerchOrder({ ...values, userId: user.id });
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: t('toast.reputation.orderSuccess.title'),
          description: t('toast.reputation.orderSuccess.description'),
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('toast.reputation.orderError.description'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Star className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reputation.title')}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{t('reputation.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Form Card */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('reputation.order.title')}</CardTitle>
            <CardDescription>{t('reputation.order.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center h-96">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold">{t('toast.reputation.orderSuccess.title')}</h3>
                  <p className="text-muted-foreground mt-2">{t('toast.reputation.orderSuccess.description')}</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="recipient" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('reputation.form.recipient')}</FormLabel>
                        <FormControl><Input placeholder="Vardenis Pavardenis" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('reputation.form.companyName')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reputation.form.address')}</FormLabel>
                      <FormControl><Input placeholder="Gatvė, namo nr., buto nr." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('reputation.form.city')}</FormLabel>
                            <FormControl><Input placeholder="Vilnius" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="postalCode" render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('reputation.form.postalCode')}</FormLabel>
                            <FormControl><Input placeholder="LT-XXXXX" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                   <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reputation.form.phone')}</FormLabel>
                      <FormControl><Input placeholder="+370..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="comment" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reputation.form.commentOptional')}</FormLabel>
                      <FormControl><Textarea placeholder={t('reputation.form.commentPlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                      {t('reputation.form.submitButton')}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Website Badge Card */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('reputation.badge.title')}</CardTitle>
              <CardDescription>{t('reputation.badge.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-xl p-4 flex items-center justify-center bg-muted/30">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="7" r="4"></circle>
                    <path d="M10.3 15H7a4 4 0 0 0-4 4v2"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <path d="m21 21-1.9-1.9"></path>
                  </svg>
                  <div>
                    <div style={{fontSize: '24px', fontWeight: 700, fontStyle: 'italic', color: '#1e293b', lineHeight: '1'}}>DriverCheck</div>
                    <div style={{fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'}}>{t('reputation.badge.partnerText')}</div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg relative group">
                <pre className="text-xs text-muted-foreground overflow-x-auto p-2">
                  <code>{embedCode}</code>
                </pre>
                <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('reputation.badge.copyCode')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
