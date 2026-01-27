import lt from '@/locales/lt.json';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import lv from '@/locales/lv.json';
import et from '@/locales/et.json';
import pl from '@/locales/pl.json';

const translationsByLocale = {
  lt,
  en,
  ru,
  lv,
  et,
  pl,
};

export type Locale = keyof typeof translationsByLocale;

const allKeys = new Set<string>();
(Object.keys(translationsByLocale) as Locale[]).forEach(lang => {
  // Ensure the object has own properties before iterating
  if (Object.prototype.hasOwnProperty.call(translationsByLocale, lang)) {
    Object.keys(translationsByLocale[lang]).forEach(key => {
      allKeys.add(key);
    });
  }
});

export const translationsMaster: Record<string, Partial<Record<Locale, string>>> = {};

allKeys.forEach(key => {
  translationsMaster[key] = {};
  (Object.keys(translationsByLocale) as Locale[]).forEach(lang => {
    if (Object.prototype.hasOwnProperty.call(translationsByLocale, lang)) {
      translationsMaster[key][lang] = translationsByLocale[lang][key as keyof typeof translationsByLocale[typeof lang]];
    }
  });
});
