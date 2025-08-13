
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
import { Mail, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from 'react';


export function LoginForm() {
  const { login, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    await login(values);
    // Do not reset form here, allows user to see what they entered if login fails.
    // Form will effectively "reset" on successful navigation.
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
        <div className="text-sm text-right">
          <Link href="/auth/forgot-password" 
                className="font-medium text-primary hover:underline">
            {t('login.forgotPasswordLink')}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={authLoading}>
          {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
