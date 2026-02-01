"use client";

import { Fuel, Car, Wine, FileWarning, Gavel, AlertOctagon, HelpCircle, UserX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { detailedReportCategories } from "@/lib/constants"; // <--- Svarbu: Imame iš tavo konstantų
import { useLanguage } from "@/contexts/language-context";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Pagalbinė funkcija priskirti ikoną ir spalvą pagal tavo kategorijos ID
// Jei tavo ID skiriasi, čia sistema pabandys atspėti geriausią variantą
const getCategoryStyle = (id: string) => {
  const lowerId = id.toLowerCase();

  if (lowerId.includes('theft') || lowerId.includes('vagyst')) 
    return { icon: Fuel, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-200 hover:border-red-500" };
  
  if (lowerId.includes('driving_safety'))
    return { icon: ShieldAlert, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-200 hover:border-cyan-500" };
  
  if (lowerId.includes('behavior'))
    return { icon: UserX, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-200 hover:border-indigo-500" };
  
  if (lowerId.includes('alcohol') || lowerId.includes('drunk') || lowerId.includes('girt')) 
    return { icon: Wine, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200 hover:border-purple-500" };
  
  if (lowerId.includes('accident') || lowerId.includes('damage') || lowerId.includes('zal') || lowerId.includes('žala') || lowerId.includes('technical_damage')) 
    return { icon: Car, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-200 hover:border-orange-500" };
  
  if (lowerId.includes('document') || lowerId.includes('fraud')) 
    return { icon: FileWarning, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 hover:border-blue-500" };
  
  if (lowerId.includes('violation') || lowerId.includes('discipline')) 
    return { icon: AlertOctagon, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-200 hover:border-yellow-500" };
  
  if (lowerId.includes('legal') || lowerId.includes('dispute')) 
    return { icon: Gavel, color: "text-slate-600", bg: "bg-slate-500/10", border: "border-slate-200 hover:border-slate-500" };

  if (lowerId.includes('aband') || lowerId.includes('palik')) 
    return { icon: UserX, color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-200 hover:border-rose-500" };

  // Default stilius, jei neradome atitikmens
  return { icon: HelpCircle, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-200 hover:border-gray-500" };
};

export function IncidentCategorySelector({ value, onChange }: CategorySelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {detailedReportCategories.map((cat) => {
        const isSelected = value === cat.id;
        const style = getCategoryStyle(cat.id);
        const Icon = style.icon;

        return (
          <div
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "cursor-pointer relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[120px]",
              style.bg,
              isSelected ? `border-current ${style.color} ring-2 ring-offset-2 ring-transparent` : "border-transparent opacity-70 hover:opacity-100 bg-slate-50 dark:bg-slate-900",
              isSelected && "opacity-100 scale-[1.02] shadow-md"
            )}
          >
            <Icon className={cn("w-8 h-8 mb-3", style.color)} />
            <span className={cn("text-xs font-bold uppercase tracking-wide text-center leading-tight", isSelected ? "text-slate-900 dark:text-white" : "text-slate-500")}>
              {/* Naudojame tavo vertimų sistemą */}
              {t(`categories.${cat.id}`) || cat.id}
            </span>
            
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}
