"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, type SignUpFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignUpPage() {
  const { signup, loading } = useAuth();
  const { t } = useLanguage();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
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

  const onSubmit = async (values: SignUpFormValues) => {
    await signup(values);
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t('signup.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.companyName.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('signup.form.companyName.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.companyCode.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('signup.form.companyCode.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="vatCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('signup.form.vatCode.label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('signup.form.vatCode.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('signup.form.address.label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('signup.form.address.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.contactPerson.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('signup.form.contactPerson.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.phone.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('signup.form.phone.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('signup.form.email.label')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('signup.form.email.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.password.label')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('signup.form.password.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signup.form.confirmPassword.label')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('signup.form.confirmPassword.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('signup.form.agreeToTerms.labelPart1')}
                      <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                        {t('signup.form.agreeToTerms.linkText')}
                      </Link>
                    </FormLabel>
                     <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('signup.form.submitButton')}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              {t('signup.form.alreadyHaveAccount')}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                {t('signup.form.loginLink')}
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
