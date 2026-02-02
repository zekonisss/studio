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
import { PremiumLoadingScreen } from "@/components/ui/premium-loading";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
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

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    if (user) {
      if (user.isAdmin) {
        window.location.replace('/admin');
      } else if (user.paymentStatus === 'active' || user.paymentStatus === 'trial') {
        window.location.replace('/dashboard');
      } else {
        router.replace('/activation-pending');
      }
    }
  }, [user, isLoading, router]);


  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(values); 
      
      toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
      });
      // The useEffect hook will handle redirection once the user state is updated.

    } catch (error: any) {
       console.error("Login error:", error);
       
       let description = error.message || t('toast.login.error.descriptionGeneric');
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           description = t('toast.login.error.invalidCredentials');
       }

        toast({
          variant: "destructive",
          title: t('toast.login.error.title'),
          description: description,
        });
    } finally {
        setIsSubmitting(false); 
    }
  };
  
  if (isLoading || (!isLoading && user)) {
     return <PremiumLoadingScreen />;
  }

  return (
    <Card className="w-full max-w-md transition-shadow duration-300 hover:shadow-glow-primary">
      <CardHeader className="items-center text-center">
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
  );
}
