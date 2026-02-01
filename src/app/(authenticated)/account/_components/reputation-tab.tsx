"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, Copy, Download, Check, UserSearch } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "@/hooks/use-toast";

export function ReputationTab() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [copied, setCopied] = useState(false);

  // El. parašui paliekame tekstinį variantą, jis gerai skaitosi
  const embedCode = `
<a href="https://drivercheck.lt" target="_blank" style="text-decoration:none;">
  <div style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px 10px;border-radius:6px;font-family:sans-serif;">
    <span style="color:#2563eb;font-weight:bold;font-size:14px;">🛡️ DriverCheck</span>
    <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Trusted Partner ${currentYear}</span>
  </div>
</a>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({
      title: "Nukopijuota!",
      description: "HTML kodas sėkmingai nukopijuotas.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
               <BadgeCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
               <CardTitle>Reputacijos ženklas</CardTitle>
               <CardDescription>Parodykite klientams, kad rūpinatės saugumu.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signature" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signature">El. pašto parašui</TabsTrigger>
              <TabsTrigger value="website">Svetainei (Badge)</TabsTrigger>
            </TabsList>

            <TabsContent value="signature" className="space-y-6">
              <div className="border rounded-xl p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-950/50">
                 <p className="text-sm text-muted-foreground mb-4">Peržiūra:</p>
                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                    <UserSearch className="h-5 w-5 text-primary" />
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-slate-800 text-sm">DriverCheck</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Trusted Partner {currentYear}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg relative group">
                <pre className="text-xs text-muted-foreground overflow-x-auto p-2">
                  {embedCode}
                </pre>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Nukopijuota" : "Kopijuoti HTML"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="website" className="space-y-6">
               <div className="border rounded-xl p-12 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                 
                 {/* ATNAUJINTAS BADGE DIZAINAS */}
                 <div className="relative flex flex-col items-center justify-center w-36 h-36 bg-white dark:bg-slate-900 rounded-full shadow-xl border-[5px] border-primary">
                    
                    {/* 1. Ikona šiek tiek mažesnė ir aukščiau */}
                    <UserSearch className="h-10 w-10 text-primary mb-1 mt-[-8px]" />
                    
                    {/* 2. TAVO PAVADINIMAS - Didelis ir ryškus */}
                    <span className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-tight">DriverCheck</span>
                    
                    {/* 3. TRUSTED užrašas - mažesnis */}
                    <span className="text-slate-400 text-[9px] font-semibold tracking-widest uppercase mt-0.5">Verified</span>
                    
                    {/* 4. Apačioje PARTNER + METAI */}
                    <div className="absolute -bottom-3.5 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                        PARTNER {currentYear}
                    </div>
                 </div>

              </div>
              
              <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => toast({ title: "Atsisiuntimas", description: "Generuojamas aukštos kokybės PNG..." })}>
                    <Download className="mr-2 h-4 w-4" />
                    Atsisiųsti PNG
                  </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
