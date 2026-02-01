import { ShieldCheck, Info, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReportGuidance({ category }: { category: string }) {
  
  // Naudojame .includes(), kad suveiktų su įvairiais ID variantais
  const getTips = (catId: string) => {
    const id = (catId || "").toLowerCase();

    if (id.includes('theft') || id.includes('vagyst')) 
        return "Būtina prisegti: CMR važtaraštį su trūkumu, policijos pažymą (jei yra) arba pasiaiškinimą.";
    
    if (id.includes('alcohol') || id.includes('drunk') || id.includes('girt')) 
        return "Būtina prisegti: Alkotesterio kvitą (su parašais) arba medicininės apžiūros aktą.";
    
    if (id.includes('accident') || id.includes('damage') || id.includes('zal') || id.includes('žala')) 
        return "Būtina prisegti: Žalos įvertinimo aktą, serviso sąskaitą arba eismo įvykio deklaraciją.";
    
    if (id.includes('document') || id.includes('fraud')) 
        return "Pateikite suklastoto dokumento kopiją ir originalo pavyzdį (jei turite).";

    if (id.includes('aband') || id.includes('palik')) 
        return "Prisekite GPS maršruto išklotinę ir susirašinėjimą su vairuotoju.";

    return "Pateikite tik faktinę informaciją. Venkite emocingų apibūdinimų ar nepagrįstų kaltinimų.";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/20 dark:bg-blue-900/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
             <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Teisinė Kokybė</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          Jūsų įrašas bus matomas kitiems vežėjams. Kad išvengtumėte ginčų dėl BDAR, prašome pateikti įrodymus.
        </p>
        
        <Alert className="bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700 dark:text-blue-400">Rekomendacija</AlertTitle>
          <AlertDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {getTips(category)}
          </AlertDescription>
        </Alert>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center text-center opacity-70">
         <FileText className="w-10 h-10 text-slate-300 mb-3" />
         <p className="text-sm font-medium text-slate-900 dark:text-white">Anonimiškumas</p>
         <p className="text-xs text-slate-500 mt-1">
           Jūsų įmonės pavadinimas bus matomas prie įrašo. Tai didina informacijos patikimumą.
         </p>
      </div>
    </div>
  );
}