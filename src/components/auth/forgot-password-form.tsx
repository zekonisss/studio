
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ForgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);

    toast({
      title: t('toast.forgotPassword.success.title'),
      description: t('toast.forgotPassword.success.description', { email: values.email }),
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />{t('forgotPassword.form.emailLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('login.emailLabel')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('forgotPassword.form.submitButton')}
        </Button>
        <div className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-primary hover:underline inline-flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('forgotPassword.backToLoginLink')}
          </Link>
        </div>
      </form>
    </Form>
  );
}
