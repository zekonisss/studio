
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Languages,
  Loader2,
  Check
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";
import { cn, getTagNameForDisplay } from "@/lib/utils";
import type { Report } from "@/types";
import { useLanguage } from "@/contexts/language-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { translateText } from "@/app/actions/translate";


interface SearchResultCardProps {
  report: Report;
}

export function SearchResultCard({ report }: SearchResultCardProps) {
  const { t, locale } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  // Reset translation state when the global language changes
  useEffect(() => {
    setTranslatedText(null);
    setIsTranslated(false);
  }, [locale]);
  
  const displayText = translatedText || report.comment || "";

  // Nustatome rizikos lygį pagal kategoriją
  const isHighRisk = DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category);

  // Spalvų paletė
  const colors = isHighRisk 
    ? { 
        border: "bg-red-500", 
        borderMain: "border-red-200 dark:border-red-900/50",
        text: "text-red-600 dark:text-red-400", 
        bg: "bg-red-500/10", 
        subBg: "bg-red-50 dark:bg-red-900/10",
        icon: "text-red-500"
      }
    : { 
        border: "bg-blue-500", 
        borderMain: "border-blue-200 dark:border-blue-900/50",
        text: "text-blue-600 dark:text-blue-400", 
        bg: "bg-blue-500/10", 
        subBg: "bg-blue-50 dark:bg-blue-900/10",
        icon: "text-blue-500"
      };

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
  };
  
  const handleTranslate = async () => {
    if (!report.comment || locale === 'lt' || isTranslated) return;
    
    setIsTranslating(true);
    try {
      const translated = await translateText(report.comment, locale);
      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (error) {
      console.error("Translation failed:", error);
      // Optional: Show a toast to the user
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn(
      "group relative w-full overflow-hidden rounded-xl border bg-white dark:bg-slate-950/50 transition-all duration-300",
      "hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700",
      colors.borderMain
    )}>
      
      {/* Kairioji Indikacijos Juosta */}
      <div className={cn("absolute left-0 top-0 h-full w-1.5 transition-colors", colors.border)}></div>

      <div className="p-5 pl-7">
        {/* HEADERIS */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {report.fullName}
              </h3>
              
              {/* Risk Badge */}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide",
                colors.bg, colors.text, colors.borderMain
              )}>
                {isHighRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{report.category ? t(`categories.${report.category}`) : report.category}</span>
              </div>
            </div>

            {/* Meta duomenys */}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              {report.birthYear && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('search.results.birthYearPrefix')}{report.birthYear}</span>
                </div>
              )}
              {report.nationality && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t(`countries.${report.nationality}`)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-400 flex flex-col items-end gap-2 shrink-0">
             <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(report.createdAt), "yyyy-MM-dd")}
             </span>
             {report.source === 'external_web' && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium cursor-help">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Viešas šaltinis
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Šis įrašas automatiškai surinktas iš viešų interneto šaltinių. Tekstas buvo apdorotas Dirbtinio Intelekto (DI), siekiant pašalinti necenzūrinę leksiką ir palikti tik faktus. Prašome vertinti kritiškai.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              )}
              {report.source === 'verified_company' && (
                  <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Patvirtintas
                  </Badge>
              )}
          </div>
        </div>

        {/* KOMENTARAS (DOSSIER STYLE) */}
        <div className="mt-5 relative">
            <div className={cn(
                "relative p-4 rounded-lg border italic text-slate-700 dark:text-slate-300 leading-relaxed",
                colors.subBg, colors.borderMain
            )}>
                
                 {locale !== 'lt' && report.comment && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleTranslate}
                            disabled={isTranslating || isTranslated}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="sr-only">Translate</span>
                            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                             isTranslated ? <Check className="w-4 h-4 text-green-500" /> : 
                             <Languages className="w-4 h-4" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                           {isTranslated ? <p>Išversta į {locale.toUpperCase()}</p> : <p>Versti į {locale.toUpperCase()}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                
                <FileText className={cn("absolute top-4 left-4 w-4 h-4 opacity-50", colors.icon)} />
                <p className={cn("pl-6 text-sm", !isExpanded && "line-clamp-2")}>
                    {displayText}
                </p>
                
                {report.comment && report.comment.length > 150 && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium mt-2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="w-3 h-3" /> Rodyti mažiau</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" /> Rodyti daugiau</>
                    )}
                  </button>
                )}
            </div>
        </div>

        {/* ŽYMOS */}
        {report.tags && report.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {report.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                <Tag className="w-3 h-3 mr-1 opacity-50" />
                {getTagNameForDisplay(tag, t)}
              </Badge>
            ))}
          </div>
        )}

        {/* PRISEGTI FAILAI */}
        {report.imageUrl && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {t('search.results.attachedFile')}
             </h4>
             
             {isImageUrl(report.imageUrl) ? (
                <a href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full md:w-64 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                   <Image 
                      src={report.imageUrl} 
                      alt="Attachment" 
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                      <ExternalLink className="text-white h-6 w-6" />
                   </div>
                </a>
             ) : (
                <a 
                  href={report.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full md:w-fit group"
                >
                   <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                      <FileText className="h-5 w-5" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dokumentas</span>
                      <span className="text-[10px] text-slate-500">Spauskite peržiūrai</span>
                   </div>
                   <ExternalLink className="h-4 w-4 ml-2 text-slate-400" />
                </a>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
