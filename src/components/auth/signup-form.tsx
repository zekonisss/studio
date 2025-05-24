
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
import { Checkbox } from "@/components/ui/checkbox";
import { SignUpSchema, type SignUpFormValues } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Building2, Briefcase, MapPin, User, Mail, Phone, Lock, Loader2, ShieldCheck, Percent } from "lucide-react";

export function SignupForm() {
  const { signup, loading } = useAuth();
  const { toast } = useToast();

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
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    try {
      await signup(values);
      toast({
        title: "Registracija inicijuota",
        description: "Netrukus gausite el. laišką paskyros patvirtinimui.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registracijos klaida",
        description: error.message || "Įvyko klaida bandant registruotis.",
      });
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
              <FormLabel className="flex items-center"><Building2 className="mr-2 h-4 w-4 text-muted-foreground" />Įmonės pavadinimas</FormLabel>
              <FormControl>
                <Input placeholder="UAB Pvz. Įmonė" {...field} />
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
              <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Įmonės kodas</FormLabel>
              <FormControl>
                <Input placeholder="123456789" {...field} />
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
              <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4 text-muted-foreground" />PVM mokėtojo kodas (nebūtinas)</FormLabel>
              <FormControl>
                <Input placeholder="LT12345678901" {...field} />
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
              <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Adresas</FormLabel>
              <FormControl>
                <Input placeholder="Pavyzdžio g. 1, Vilnius" {...field} />
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
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Kontaktinis asmuo</FormLabel>
              <FormControl>
                <Input placeholder="Vardenis Pavardenis" {...field} />
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
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />El. paštas</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jusu@imone.lt" {...field} />
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
              <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Telefonas</FormLabel>
              <FormControl>
                <Input placeholder="+37060012345" {...field} />
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
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Slaptažodis</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
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
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Pakartokite slaptažodį</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  Sutinku su <Link href="/terms" className="text-primary hover:underline">naudojimosi taisyklėmis</Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registruotis
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Jau turite paskyrą?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Prisijunkite
          </Link>
        </p>
      </form>
    </Form>
  );
}
