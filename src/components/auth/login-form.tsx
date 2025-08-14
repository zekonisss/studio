
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
      await login(values);
      // The redirect is handled by the useAuth hook's onAuthStateChanged listener
    } catch (error) {
       // The error toast is already handled inside the login function of useAuth
      console.error("Login form submission error:", error);
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
               <div className="text-right text-sm">
                <Link href="/auth/forgot-password" tabIndex={-1} className="font-medium text-primary hover:underline">
                  {t('login.forgotPasswordLink')}
                </Link>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
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
