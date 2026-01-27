"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { SignupFormSchema, type SignupFormValuesExtended } from "@/lib/schemas";


export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<SignupFormValuesExtended>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        companyCode: "",
        vatCode: "",
        address: "",
        contactPerson: "",
        phone: "",
        agreeToTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValuesExtended) => {
    try {
      await signup(data);
      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });
      router.push("/activation-pending");
    } catch (error: any) {
       let description = t('toast.signup.error.descriptionGeneric');
       if (error.code === 'auth/email-already-in-use') {
           description = t('toast.signup.error.emailExists');
       }
       toast({
        variant: "destructive",
        title: t('toast.signup.error.title'),
        description: description,
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl transition-shadow duration-300 hover:shadow-glow-primary">
        <CardHeader className="items-center text-center">
            <UserPlus className="h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl">{t('signup.title')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.companyName.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.companyName.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="companyCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.companyCode.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.companyCode.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="vatCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.vatCode.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.vatCode.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>{t('signup.form.address.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.address.placeholder')} {...field} /></FormControl>
                                <FormDescription>{t('signup.form.address.description')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="contactPerson" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.contactPerson.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.contactPerson.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.phone.label')}</FormLabel>
                                <FormControl><Input placeholder={t('signup.form.phone.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('signup.form.email.label')}</FormLabel>
                                    <FormControl><Input type="email" placeholder={t('signup.form.email.placeholder')} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.password.label')}</FormLabel>
                                <FormControl><Input type="password" placeholder={t('signup.form.password.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('signup.form.confirmPassword.label')}</FormLabel>
                                <FormControl><Input type="password" placeholder={t('signup.form.confirmPassword.placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    {t('signup.form.agreeToTerms.labelPart1')}
                                    <Link href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">
                                        {t('signup.form.agreeToTerms.linkText')}
                                    </Link>
                                </FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )} />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('signup.form.submitButton')}
                    </Button>
                </form>
            </Form>
             <div className="mt-6 text-center text-sm">
                {t('signup.form.alreadyHaveAccount')}
                <Link href="/login" className="underline text-primary">
                    {t('signup.form.loginLink')}
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}
