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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SignupFormSchema, type SignupFormValuesExtended } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);


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

  const onSubmit = async (values: SignupFormValuesExtended) => {
    setIsLoading(true);
    try {
      await signup(values);
      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("[SIGNUP] Error:", error);
      
      let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = t('toast.signup.error.emailExists');
            break;
          case 'auth/weak-password':
            errorMessage = t('toast.signup.error.weakPassword');
            break;
          case 'auth/invalid-email':
            errorMessage = t('toast.signup.error.invalidEmail');
            break;
        }
      }

      toast({
        variant: "destructive",
        title: t('toast.signup.error.title'),
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{t('signup.title')}</CardTitle>
        <CardDescription>{t('signup.description_short')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Separator className="my-6" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input placeholder={t('signup.form.email.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('signup.form.agreeToTerms.labelPart1')}
                      <Link href="/terms" target="_blank" className="underline hover:text-primary">
                        {t('signup.form.agreeToTerms.linkText')}
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('signup.form.submitButton')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
            {t('signup.form.alreadyHaveAccount')}
          <Link href="/login" className="underline">
            {t('signup.form.loginLink')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
