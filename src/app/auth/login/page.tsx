"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const { login, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login(values);
  };
  
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jusu@imone.lt" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('login.noAccount')}{' '}
                  <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                    {t('login.signupLink')}
                  </Link>
                </p>
                {/* <Button variant="link" type="button" onClick={handleForgotPassword} className="px-0">
                  {t('login.forgotPasswordLink')}
                </Button> */}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('login.loginButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
