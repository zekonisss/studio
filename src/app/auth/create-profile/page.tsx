
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { CreateProfileSchema, type CreateProfileFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useState, useEffect } from 'react';
import { Building2, Briefcase, MapPin, User, Phone, Loader2, Percent, Save } from "lucide-react";
import * as storage from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateProfileFormValues>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: {
      companyName: "",
      companyCode: "",
      vatCode: "",
      address: "",
      contactPerson: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  async function onSubmit(values: CreateProfileFormValues) {
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
        await storage.createProfileForUser(user.id, user.email || '', values);
        toast({
            title: t('createProfile.toast.success.title'),
            description: t('createProfile.toast.success.description'),
        });
        const isAdmin = user.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
        await storage.updateUserProfile(user.id, { isAdmin });

        router.replace(isAdmin ? '/admin' : '/dashboard');

    } catch (error: any) {
        toast({ variant: 'destructive', title: t('createProfile.toast.error.title'), description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t('createProfile.title')}</CardTitle>
        <CardDescription>{t('createProfile.description')}</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('createProfile.submitButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
