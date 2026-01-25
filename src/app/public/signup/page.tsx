"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Truck, Warehouse, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const roleParam = searchParams.get("role");
  const defaultRole = roleParam === "partner" ? "partner" : "carrier";
  
  const [role, setRole] = useState<'carrier' | 'partner'>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyCode: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: role.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registracija nepavyko");
      }

      toast({
        title: "Sveikiname!",
        description: "Paskyra sukurta. Nukreipiama į prisijungimą...",
      });

      setTimeout(() => {
        router.push("/"); 
      }, 1500);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Klaida",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Grįžti į prisijungimą
      </Link>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-2xl ${role === 'carrier' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
            {role === 'carrier' ? <Truck className="h-8 w-8" /> : <Warehouse className="h-8 w-8" />}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {role === 'carrier' ? "Vežėjo Registracija" : "Partnerio Registracija"}
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          {role === 'carrier' 
            ? "Prisijunkite prie saugiausių vežėjų bendruomenės." 
            : "Pradėkite valdyti rizikas ir incidentus."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setRole('carrier')}
          className={`py-2 text-sm font-medium rounded-lg transition-all ${
            role === 'carrier' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Transporto Įmonė
        </button>
        <button
          type="button"
          onClick={() => setRole('partner')}
          className={`py-2 text-sm font-medium rounded-lg transition-all ${
            role === 'partner' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Sandėlys / Partneris
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="companyName">Įmonės pavadinimas</Label>
                <Input id="companyName" placeholder="UAB Trans..." required onChange={handleChange} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="companyCode">Įmonės kodas</Label>
                <Input id="companyCode" placeholder="3000..." required onChange={handleChange} className="h-11 rounded-xl" />
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="name">Vadybininko Vardas</Label>
            <Input id="name" placeholder="Jonas Jonaitis" required onChange={handleChange} className="h-11 rounded-xl" />
        </div>

        <div className="space-y-2">
            <Label htmlFor="email">Darbo el. paštas</Label>
            <Input id="email" type="email" placeholder="jonas@imone.lt" required onChange={handleChange} className="h-11 rounded-xl" />
        </div>

        <div className="space-y-2">
            <Label htmlFor="password">Slaptažodis</Label>
            <Input id="password" type="password" placeholder="Min. 8 simboliai" required onChange={handleChange} className="h-11 rounded-xl" />
        </div>

        <Button 
            type="submit" 
            className={`w-full h-12 mt-4 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 ${
                role === 'carrier' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' 
                : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
            }`} 
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isLoading ? "Kuriama paskyra..." : "Registruotis"}
        </Button>
      </form>

      <div className="text-center text-xs text-slate-400 mt-6">
        Registruodamiesi sutinkate su <span className="underline cursor-pointer">Taisyklėmis</span>.
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-[#0f172a] z-0"></div>
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] z-0"></div>

        <div className="container mx-auto relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-10">
            <div className="mb-8 flex items-center gap-2 text-white">
                 <ShieldCheck className="h-8 w-8 text-blue-400" />
                 <span className="text-2xl font-bold tracking-wide">DriverCheck</span>
            </div>
            
            <Suspense fallback={<div className="text-white">Kraunama...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    </div>
  );
}