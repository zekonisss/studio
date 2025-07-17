
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { SignUpSchema, type SignUpFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from 'react';

export function SignupForm() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signup(values);
      // Redirect is handled inside useAuth's signup function
    } catch (error) {
      // Toast is already handled inside useAuth's signup function
      console.error("Signup submission failed in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.email.label')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('signup.form.email.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.password.label')}</FormLabel>
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
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.confirmPassword.label')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={t('signup.form.confirmPassword.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t('signup.form.agreeToTerms.labelPart1')}
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">
                    {t('signup.form.agreeToTerms.linkText')}
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('signup.form.submitButton')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('signup.form.alreadyHaveAccount')}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            {t('login.loginButton')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
