
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginSchema, type LoginFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { UserSearch } from "lucide-react";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
        router.replace('/dashboard');
    }
  }, [user, loading, router]);


  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(values);
      toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
      });
      router.push('/dashboard');
    } catch (error: any) {
       console.error("Login error:", error);
        toast({
          variant: "destructive",
          title: t('toast.login.error.title'),
          description: error.code === 'auth/invalid-credential' 
            ? t('toast.login.error.invalidCredentials') 
            : error.message || t('toast.login.error.descriptionGeneric'),
        });
    } finally {
        setIsSubmitting(false); 
    }
  };
  
  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Link href="/" className="absolute top-8 flex items-center gap-2 text-lg font-semibold text-primary cursor-pointer">
            <UserSearch className="h-7 w-7" />
            <span>DriverCheck</span>
        </Link>
        <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('login.emailLabel')}</FormLabel>
                    <FormControl>
                        <Input placeholder="jusu@imone.lt" {...field} disabled={isSubmitting} />
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
                    <FormLabel>{t('login.passwordLabel')}</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('login.loginButton')}
                </Button>
            </form>
            </Form>
            <div className="mt-4 text-center text-sm">
            {t('login.noAccount')}{" "}
            <Link href="/signup" className="underline">
                {t('login.signupLink')}
            </Link>
            </div>
            <div className="mt-2 text-center text-sm">
            <Link href="/forgot-password" className="underline text-xs text-muted-foreground">
                {t('login.forgotPasswordLink')}
            </Link>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
