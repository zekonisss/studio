"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "CARRIER"; // Gauname rolę iš URL

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await signup({ ...data, role });
      router.push("/login?registered=true");
    } catch (error) {
      alert("Klaida: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">DriverCheck</CardTitle>
          <CardDescription>
            Registracija {role === "PARTNER" ? "partneriams" : "transporto įmonėms"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kairė stulpelė */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vardas, Pavardė</Label>
                  <Input {...register("name")} placeholder="Jonas Jonaitis" required />
                </div>
                <div className="space-y-2">
                  <Label>El. paštas</Label>
                  <Input {...register("email")} type="email" placeholder="jonas@imone.lt" required />
                </div>
                <div className="space-y-2">
                  <Label>Slaptažodis</Label>
                  <Input {...register("password")} type="password" required />
                </div>
              </div>

              {/* Dešinė stulpelė */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Įmonės pavadinimas</Label>
                  <Input {...register("companyName")} placeholder="UAB Logistika" />
                </div>
                <div className="space-y-2">
                  <Label>Įmonės kodas</Label>
                  <Input {...register("companyCode")} placeholder="123456789" />
                </div>
                <div className="space-y-2">
                  <Label>Telefono numeris</Label>
                  <Input {...register("phoneNumber")} placeholder="+37060000000" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" disabled={isLoading}>
              {isLoading ? "Registruojama..." : "Sukurti paskyrą"}
            </Button>

            <button 
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-full text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Grįžti į pasirinkimą
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}