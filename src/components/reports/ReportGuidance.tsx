import { ShieldCheck, Info, FileText, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReportGuidance({ category }: { category: string }) {
  
  // Patarimai pagal kategoriją (sušvelninti)
  const getTips = (catId: string) => {
    const id = (catId || "").toLowerCase();

    if (id.includes('theft') || id.includes('vagyst')) 
        return "Rekomenduojami įrodymai: CMR važtaraštis su trūkumo žyma, susirašinėjimas ar policijos pažyma.";
    
    if (id.includes('alcohol') || id.includes('drunk') || id.includes('girt')) 
        return "Rekomenduojami įrodymai: Nušalinimo aktas, alkotesterio kvitas (jei yra) ar liudininkų paaiškinimai.";
    
    if (id.includes('accident') || id.includes('damage') || id.includes('zal') || id.includes('žala')) 
        return "Rekomenduojami įrodymai: Žalos defektacijos aktas, nuotraukos iš įvykio vietos ar eismo įvykio deklaracija.";
    
    if (id.includes('document') || id.includes('fraud')) 
        return "Svarbu: Įkelkite tik tą dokumento dalį, kuri įrodo klastojimo faktą.";

    if (id.includes('aband') || id.includes('palik')) 
        return "Rekomenduojami įrodymai: GPS maršruto išklotinė, įrodanti nukrypimą, arba žinutės apie atsisakymą dirbti.";

    return "Pateikite tik faktinę informaciją, susijusią su darbo pareigų vykdymu.";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/20 dark:bg-blue-900/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
             <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Duomenų Privatumas</h3>
        </div>
        
        {/* PAKEISTAS TEKSTAS ČIA: */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          Jūsų įrašas bus matomas kitiems vežėjams. Kad išvengtumėte BDAR pažeidimų, 
          <span className="font-semibold text-slate-700 dark:text-slate-300"> nenaudokite perteklinės asmeninės informacijos</span>:
        </p>
        
        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside mb-5 space-y-1 ml-1">
            <li>Nerašykite asmens kodų.</li>
            <li>Nekelkite asmens dokumentų kopijų (pasų, ID kortelių).</li>
            <li>Nurodykite tik vardą, pavardę ir gimimo metus.</li>
        </ul>
        
        <Alert className="bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800 shadow-sm">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wide">
            Patarimas dėl įrodymų
          </AlertTitle>
          <AlertDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {getTips(category)}
          </AlertDescription>
        </Alert>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity">
         <Lock className="w-8 h-8 text-slate-400 mb-3" />
         <p className="text-sm font-medium text-slate-900 dark:text-white">Saugus Dalinimasis</p>
         <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
           Informacija prieinama tik patvirtintoms transporto įmonėms.
         </p>
      </div>
    </div>
  );
}