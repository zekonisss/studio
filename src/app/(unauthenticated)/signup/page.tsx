
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { SignupFormSchema, type SignupFormValuesExtended } from "@/lib/schemas";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SignupPage() {
  const { signup } = useAuth();
  const { t } = useLanguage();
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
    await signup(values);
    setIsLoading(false);
  };

  return (
    <Card className="mx-auto w-full max-w-lg">
       <CardHeader>
        <CardTitle className="text-2xl">{t("signup.title")}</CardTitle>
        <CardDescription>
          {t("signup.form.alreadyHaveAccount")}{" "}
          <Link href="/login" className="underline">
            {t("signup.form.loginLink")}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("signup.form.companyName.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.companyName.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.companyCode.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.companyCode.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.vatCode.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.vatCode.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.address.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.address.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.contactPerson.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.contactPerson.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.phone.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.phone.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.email.label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("signup.form.email.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.password.label")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("signup.form.password.placeholder")} {...field} />
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
                      <FormLabel>{t("signup.form.confirmPassword.label")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("signup.form.confirmPassword.placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          {t("signup.form.agreeToTerms.labelPart1")}
                           <Link href="/terms" className="underline" target="_blank">
                             {t("signup.form.agreeToTerms.linkText")}
                          </Link>
                        </FormLabel>
                      </div>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
             <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("signup.form.submitButton")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
