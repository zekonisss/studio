import { ShieldCheck, Info, FileText, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";

export function ReportGuidance({ category }: { category: string }) {
  const { t } = useLanguage();
  
  const getTips = (catId: string) => {
    const id = (catId || "").toLowerCase();

    if (id.includes('theft') || id.includes('vagyst')) 
        return t('reports.guidance.evidence.tip.fuel_theft');
    
    if (id.includes('alcohol') || id.includes('drunk') || id.includes('girt')) 
        return t('reports.guidance.evidence.tip.alcohol');
    
    if (id.includes('accident') || id.includes('damage') || id.includes('zal') || id.includes('žala')) 
        return t('reports.guidance.evidence.tip.damage');
    
    if (id.includes('document') || id.includes('fraud')) 
        return t('reports.guidance.evidence.tip.document');

    if (id.includes('aband') || id.includes('palik')) 
        return t('reports.guidance.evidence.tip.abandon');

    return t('reports.guidance.evidence.tip.default');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/20 dark:bg-blue-900/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
             <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('reports.guidance.privacy.title')}</h3>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {t('reports.guidance.privacy.description')}
        </p>
        
        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside mb-5 space-y-1 ml-1">
            <li>{t('reports.guidance.privacy.rule1')}</li>
            <li>{t('reports.guidance.privacy.rule2')}</li>
            <li>{t('reports.guidance.privacy.rule3')}</li>
        </ul>
        
        <Alert className="bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800 shadow-sm">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wide">
            {t('reports.guidance.evidence.title')}
          </AlertTitle>
          <AlertDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {getTips(category)}
          </AlertDescription>
        </Alert>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity">
         <Lock className="w-8 h-8 text-slate-400 mb-3" />
         <p className="text-sm font-medium text-slate-900 dark:text-white">{t('reports.guidance.sharing.title')}</p>
         <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
           {t('reports.guidance.sharing.description')}
         </p>
      </div>
    </div>
  );
}
