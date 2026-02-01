import { ShieldCheck, Info, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReportGuidance({ category }: { category: string }) {
  
  const getTips = () => {
    switch (category) {
      case "THEFT":
        return "Būtina prisegti: CMR važtaraštį su trūkumu, policijos pažymą (jei yra) arba pasiaiškinimą.";
      case "ALCOHOL":
        return "Būtina prisegti: Alkotesterio kvitą (su parašais) arba medicininės apžiūros aktą.";
      case "ACCIDENT":
        return "Būtina prisegti: Žalos įvertinimo aktą, serviso sąskaitą arba eismo įvykio deklaraciją.";
      default:
        return "Pateikite tik faktinę informaciją. Venkite emocingų apibūdinimų ar nepagrįstų kaltinimų.";
    }
  };

  return (
    <div className="space-y-6 sticky top-6">
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
            {getTips()}
          </AlertDescription>
        </Alert>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center text-center">
         <FileText className="w-10 h-10 text-slate-300 mb-3" />
         <p className="text-sm font-medium text-slate-900 dark:text-white">Anonimiškumas</p>
         <p className="text-xs text-slate-500 mt-1">
           Jūsų įmonės pavadinimas bus matomas prie įrašo. Tai didina informacijos patikimumą.
         </p>
      </div>
    </div>
  );
}