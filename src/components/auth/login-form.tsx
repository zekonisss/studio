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

export function LoginForm() {
  const { login, loading } = useAuth();
  const { toast } = useToast();

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
      toast({
        title: "Sėkmingai prisijungėte!",
        description: "Sveiki sugrįžę į DriverShield.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Prisijungimo klaida",
        description: error.message || "Įvyko klaida bandant prisijungti.",
      });
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
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />El. paštas</FormLabel>
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
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Slaptažodis</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Prisijungti
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Neturite paskyros?{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Registruokitės
          </Link>
        </p>
      </form>
    </Form>
  );
}
