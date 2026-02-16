"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Star, Image as ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReputationPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

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
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Patikimas Partneris ${currentYear}</div>
    </div>
  </div>
</a>
  `.trim();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Kodas nukopijuotas",
      description: "Dabar galite jį įklijuoti į savo svetainės HTML kodą.",
    });
  };

  const handleCopyImage = () => {
    // In a real app, this would copy an actual image to the clipboard.
    // For now, we just show a toast.
    toast({
      title: "Funkcija ruošiama",
      description: "Galimybė kopijuoti parašo paveikslėlį bus įdiegta greitai.",
    });
  };
  
  const handleDownloadPdf = () => {
     toast({
      title: "Funkcija ruošiama",
      description: "Sertifikato generavimas ir atsisiuntimas bus įdiegtas greitai.",
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Star className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jūsų Patikimumo Ženklas</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">Parodykite vairuotojams ir partneriams, kad esate skaidri ir patikima įmonė. Naudokite šiuos ženklelius savo komunikacijoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Website Badge */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Svetainės Ženklelis</CardTitle>
            <CardDescription>Įdėkite šį HTML kodą į savo svetainę, kad parodytumėte narystę.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="border rounded-xl p-8 flex items-center justify-center bg-muted/30">
                {/* Preview */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="10" cy="7" r="4"></circle>
                        <path d="M10.3 15H7a4 4 0 0 0-4 4v2"></path>
                        <circle cx="17" cy="17" r="3"></circle>
                        <path d="m21 21-1.9-1.9"></path>
                    </svg>
                    <div style={{lineHeight: 1.2}}>
                        <span style={{fontSize: '16px', fontWeight: 700, fontStyle: 'italic', color: '#1e293b'}}>DriverCheck</span>
                        <div style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Patikimas Partneris {currentYear}</div>
                    </div>
                </div>
             </div>
             <div className="bg-muted/50 p-4 rounded-lg relative group">
                <pre className="text-xs text-muted-foreground overflow-x-auto p-2">
                  <code>{embedCode}</code>
                </pre>
                <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4 mr-1" />
                  Kopijuoti kodą
                </Button>
              </div>
          </CardContent>
        </Card>

        <div className="col-span-1 flex flex-col gap-6">
            {/* Card 2: Email Signature */}
            <Card>
              <CardHeader>
                <CardTitle>El. Pašto Parašas</CardTitle>
                <CardDescription>Pridėkite prie savo komandos el. pašto parašų.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="border rounded-lg p-4 text-center bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Parašo peržiūra</p>
                    <div className="text-sm bg-white dark:bg-slate-800 p-2 rounded inline-block shadow-sm">
                        <p className="font-semibold">Vardenis Pavardenis</p>
                        <p className="text-xs text-muted-foreground">Transporto Vadybininkas</p>
                        <p className="text-xs mt-2 text-blue-600 font-medium">Mes tikriname vairuotojų istoriją su <span className="font-bold">DriverCheck</span>.</p>
                    </div>
                 </div>
                <Button className="w-full" variant="outline" onClick={handleCopyImage}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Kopijuoti paveikslėlį
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Certificate */}
            <Card>
              <CardHeader>
                <CardTitle>Narystės Sertifikatas</CardTitle>
                <CardDescription>Atsisiųskite PDF sertifikatą spausdinimui.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleDownloadPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Atsisiųsti PDF
                </Button>
              </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
