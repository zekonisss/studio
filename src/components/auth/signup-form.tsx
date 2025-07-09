
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Building2, Briefcase, MapPin, User, Mail, Phone, Lock, Loader2, Percent, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Separator } from "@/components/ui/separator";
import { useState } from 'react';

export function SignupForm() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      companyName: "",
      companyCode: "",
      vatCode: "",
      address: "",
      contactPerson: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      addOneSubUser: false,
      subUserName: "",
      subUserEmail: "",
      subUserPassword: "",
    },
  });

  const addOneSubUser = useWatch({
    control: form.control,
    name: 'addOneSubUser',
  });

  async function onSubmit(values: SignUpFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await signup(values);
      if (success) {
        router.push('/auth/pending-approval');
      }
    } catch (error) {
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
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Building2 className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.companyName.label')}</FormLabel>
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
              <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.companyCode.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('signup.form.companyCode.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vatCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.vatCode.label')}</FormLabel>
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
              <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.address.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('signup.form.address.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.contactPerson.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('signup.form.contactPerson.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.phone.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('signup.form.phone.placeholder')} {...field} />
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

        <Separator className="my-6" />

        <FormField
          control={form.control}
          name="addOneSubUser"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="addOneSubUser"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="addOneSubUser" className="cursor-pointer flex items-center">
                  <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                  {t('signup.form.addOneSubUser.label')}
                </FormLabel>
                <FormDescription>
                  {t('signup.form.addOneSubUser.description')}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {addOneSubUser && (
          <div className="space-y-4 p-4 border rounded-md mt-4 bg-card shadow">
            <h3 className="text-md font-semibold text-primary flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                {t('signup.form.subUserSection.title')}
            </h3>
            <FormField
              control={form.control}
              name="subUserName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.subUserName.label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('signup.form.subUserName.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subUserEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.subUserEmail.label')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('signup.form.subUserEmail.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subUserPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />{t('signup.form.subUserPassword.label')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t('signup.form.subUserPassword.placeholder')} {...field} />
                  </FormControl>
                   <FormDescription>{t('signup.form.subUserPassword.description')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        <Separator className="my-6" />

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
                  <Link href="/terms" className="text-primary hover:underline">
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
            {t('signup.form.loginLink')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
