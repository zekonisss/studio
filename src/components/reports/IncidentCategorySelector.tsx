"use client";

import { Fuel, Car, Wine, FileWarning, Gavel, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  { id: "THEFT", label: "Kuro/Krovinio Vagystė", icon: Fuel, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-200 hover:border-red-500" },
  { id: "ALCOHOL", label: "Girtumas darbe", icon: Wine, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200 hover:border-purple-500" },
  { id: "ACCIDENT", label: "Žala technikai", icon: Car, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-200 hover:border-orange-500" },
  { id: "DOCUMENTS", label: "Dokumentų klastojimas", icon: FileWarning, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 hover:border-blue-500" },
  { id: "VIOLATION", label: "Šiurkštus pažeidimas", icon: AlertOctagon, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-200 hover:border-yellow-500" },
  { id: "LEGAL", label: "Teisinis ginčas", icon: Gavel, color: "text-slate-600", bg: "bg-slate-500/10", border: "border-slate-200 hover:border-slate-500" },
];

export function IncidentCategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((cat) => {
        const isSelected = value === cat.id;
        return (
          <div
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "cursor-pointer relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              cat.bg,
              isSelected ? `border-current ${cat.color} ring-2 ring-offset-2 ring-transparent` : "border-transparent opacity-70 hover:opacity-100 bg-slate-50 dark:bg-slate-900",
              isSelected && "opacity-100 scale-[1.02] shadow-md"
            )}
          >
            <cat.icon className={cn("w-8 h-8 mb-3", cat.color)} />
            <span className={cn("text-xs font-bold uppercase tracking-wide text-center", isSelected ? "text-slate-900 dark:text-white" : "text-slate-500")}>
              {cat.label}
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