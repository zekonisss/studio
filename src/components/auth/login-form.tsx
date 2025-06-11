
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
import { LoginSchema, type LoginFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function LoginForm() {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values); // login function now handles toasts internally
    } catch (error: any) {
      // Error handling is now more centralized in useAuth, but specific UI feedback can remain
      // This catch block might be redundant if useAuth always throws for UI-displayable errors
      // or if it directly updates UI state for errors.
      // For now, let's assume some errors might still need to be caught here for generic fallback.
      if (!error.isAuthManagedError) { // Add a flag to errors managed by useAuth
         toast({
            variant: "destructive",
            title: t('toast.login.error.title'),
            description: error.message || t('toast.login.error.descriptionGeneric'),
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />{t('login.emailLabel')}</FormLabel>
              <FormControl>
                <Input placeholder="jusu@imone.lt" {...field} />
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
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />{t('login.passwordLabel')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-sm">
          <Link href="/auth/forgot-password" // Placeholder link
                className="font-medium text-primary hover:underline">
            {t('login.forgotPasswordLink')}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('login.loginButton')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            {t('login.signupLink')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
