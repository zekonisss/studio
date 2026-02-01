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

  // NAUJAS KODAS: Atnaujintas stilius, kad atitiktų pagrindinį logo
  const embedCode = `
<a href="https://drivercheck.lt" target="_blank" style="text-decoration:none;">
  <div style="display:inline-flex;align-items:center;gap:8px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;background-color:#f8fafc;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="10" cy="7" r="4"></circle>
        <path d="M10.3 15H7a4 4 0 0 0-4 4v2"></path>
        <circle cx="17" cy="17" r="3"></circle>
        <path d="m21 21-1.9-1.9"></path>
    </svg>
    <div style="line-height:1.2;">
        <span style="font-size:16px;font-weight:700;font-style:italic;color:#1e293b;">DriverCheck</span>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Trusted Partner ${currentYear}</div>
    </div>
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
                 {/* NAUJAS KODAS: Atnaujinta peržiūra */}
                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
                    <UserSearch className="h-8 w-8 text-primary" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xl font-bold italic text-slate-800">
                            DriverCheck
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            Trusted Partner {currentYear}
                        </span>
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
                 
                 {/* NAUJAS KODAS: Atnaujintas ženklas svetainei */}
                 <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-md dark:bg-slate-900/50">
                    <UserSearch className="h-12 w-12 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold italic bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                            DriverCheck
                        </span>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Trusted Partner {currentYear}
                        </span>
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
