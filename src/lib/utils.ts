
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { detailedReportCategories } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryNameForDisplay(categoryId: string, t: (key: string) => string): string {
  const category = detailedReportCategories.find(c => c.id === categoryId);
  return category ? t(category.nameKey) : categoryId;
}

export const migrateTagIfNeeded = (tagValue: string): string => {
  if (typeof tagValue !== 'string') return tagValue; 

  const lithuanianToKeyMap: Record<string, string> = {
    "Kuro vagystė": "kuro_vagyste",
    "Krovinio vagystė": "krovinio_vagyste",
    "Įmonės turto vagystė": "imones_turto_vagyste",
    "Avaringumas": "avaringumas",
    "Pavojingas vairavimas": "pavojingas_vairavimas",
    "Dažni KET pažeidimai": "dazni_ket_pazeidimai",
    "Grasinimai / agresija": "grasinimai_agresija",
    "Netinkamas elgesys kolegų atžvilgiu": "netinkamas_elgesys_kolegu_atzvilgiu",
    "Psichotropinių medžiagų vartojimas": "psichotropiniu_medziagu_vartojimas",
    "Konfliktiškas asmuo": "konfliktiskas_asmuo",
    "Neblaivus darbo metu": "neblaivus_darbo_metu",
    "Neatvykimas į darbą be pateisinamos priežasties": "neatvykimas_i_darba_be_pateisinamos_priezasties",
    "Neatsakingas požiūris į darbą": "neatsakingas_poziuris_i_darba",
    "Techninis neatsakingumas": "techninis_neatsakingumas",
    "Rizika saugumui ar kroviniui": "rizika_saugumui_ar_kroviniui",
    "Dažni transporto priemonės pažeidimai": "dazni_transporto_priemones_pazeidimai",
    "Buvo teisinis procesas / darbo ginčas": "buvo_teisinis_procesas_darbo_gincas",
    "Pakenkta įmonės reputacijai": "pakenkta_imones_reputacijai",
    "Neteisėta veikla įtariama": "neteiseta_veikla_itariama",
    "Kita": "kita_tag"
  };

  if (lithuanianToKeyMap[tagValue]) {
    return lithuanianToKeyMap[tagValue];
  }

  if (tagValue.startsWith("tags.")) {
    const potentialPhrase = tagValue.substring(5);
    if (lithuanianToKeyMap[potentialPhrase]) {
      return lithuanianToKeyMap[potentialPhrase];
    }
  }
  
  return tagValue;
};
