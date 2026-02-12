
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, UserSearch } from "lucide-react";
import Link from 'next/link';

// --- INTERNATIONALIZATION ---
type Lang = 'LT' | 'EN' | 'PL' | 'RU';

const TRANSLATIONS = {
  LT: {
    title: "Vairuotojo Darbo Istorijos Patikra",
    intro: "DriverCheck – vairuotojų patikros sistemoje buvo sukurta užklausa dėl vairuotojo **{name}**.",
    companyInfo: "Jūsų įmonė **{company}** buvo nurodyta kaip buvusi šio vairuotojo darbovietė.",
    cta: "Maloniai kviečiame Jus patvirtinti arba patikslinti šį įrašą.",
    driverLabel: "Vairuotojas",
    birthDateLabel: "Gimimo data",
    periodLabel: "Darbo laikotarpis",
    question1: "Ar {name} dirbo Jūsų įmonėje nurodytu laikotarpiu?",
    question2: "Ar priimtumėte šį asmenį dirbti atgal?",
    question3: "Komentaras (neprivaloma, bet rekomenduojama)",
    commentPlaceholder: "Pateikite trumpą, dalykišką komentarą apie vairuotojo veiklą...",
    btnYes: "Taip",
    btnNo: "Ne",
    btnConfirm: "Patvirtinti ir Išsiųsti",
    loadingText: "Tikrinama nuoroda...",
    invalidLinkTitle: "Neteisinga Nuoroda",
    invalidLinkDesc: "Patvirtinimo nuoroda yra neteisinga arba nebegalioja.",
    successTitle: "Ačiū už Jūsų indėlį į skaidrumą.",
    successP1: "Jūs ką tik padėjote kolegai.",
    successP2: "O kaip Jūs šiandien valdote savo vairuotojų rizikas?",
    successP3: "„Nuojauta“ transporto versle kainuoja per brangiai. Prisijunkite prie bendruomenės, kuri sprendimus priima remdamasi faktais.",
    successBtn: "Prisijungti prie Patikimų Vežėjų"
  },
  EN: {
    title: "Driver Employment Verification",
    intro: "A request has been initiated in the DriverCheck system for the driver **{name}**.",
    companyInfo: "Your company, **{company}**, was listed as this driver's former employer.",
    cta: "We kindly invite you to confirm or clarify this record.",
    driverLabel: "Driver",
    birthDateLabel: "Date of Birth",
    periodLabel: "Employment Period",
    question1: "Did {name} work at your company during the specified period?",
    question2: "Would you rehire this person?",
    question3: "Comment (optional, but recommended)",
    commentPlaceholder: "Provide a brief, factual comment about the driver's performance...",
    btnYes: "Yes",
    btnNo: "No",
    btnConfirm: "Confirm and Send",
    loadingText: "Verifying link...",
    invalidLinkTitle: "Invalid Link",
    invalidLinkDesc: "The verification link is incorrect or has expired.",
    successTitle: "Thank you for contributing to transparency.",
    successP1: "You have just helped a colleague.",
    successP2: "And how do you manage your driver risks today?",
    successP3: "\"Gut feeling\" is too expensive in the transport business. Join a community that makes decisions based on facts.",
    successBtn: "Join Trusted Carriers"
  },
  PL: {
    title: "Weryfikacja Historii Zatrudnienia Kierowcy",
    intro: "W systemie DriverCheck zostało zainicjowane zapytanie dotyczące kierowcy **{name}**.",
    companyInfo: "Twoja firma, **{company}**, została wskazana jako poprzedni pracodawca tego kierowcy.",
    cta: "Serdecznie zapraszamy do potwierdzenia lub sprostowania tego wpisu.",
    driverLabel: "Kierowca",
    birthDateLabel: "Data urodzenia",
    periodLabel: "Okres zatrudnienia",
    question1: "Czy {name} pracował w Twojej firmie w podanym okresie?",
    question2: "Czy zatrudniłbyś tę osobę ponownie?",
    question3: "Komentarz (opcjonalny, ale zalecany)",
    commentPlaceholder: "Podaj krótki, rzeczowy komentarz na temat pracy kierowcy...",
    btnYes: "Tak",
    btnNo: "Nie",
    btnConfirm: "Potwierdź i wyślij",
    loadingText: "Weryfikowanie linku...",
    invalidLinkTitle: "Nieprawidłowy Link",
    invalidLinkDesc: "Link weryfikacyjny jest nieprawidłowy lub wygasł.",
    successTitle: "Dziękujemy za wkład w przejrzystość.",
    successP1: "Właśnie pomogłeś koledze.",
    successP2: "A jak dziś zarządzasz ryzykiem związanym z kierowcami?",
    successP3: "\"Przeczucie\" w branży transportowej jest zbyt drogie. Dołącz do społeczności, która podejmuje decyzje w oparciu o fakty.",
    successBtn: "Dołącz do Zaufanych Przewoźników"
  },
  RU: {
    title: "Проверка истории работы водителя",
    intro: "В системе DriverCheck был создан запрос по водителю **{name}**.",
    companyInfo: "Ваша компания, **{company}**, была указана как бывшее место работы этого водителя.",
    cta: "Просим вас подтвердить или уточнить данную запись.",
    driverLabel: "Водитель",
    birthDateLabel: "Дата рождения",
    periodLabel: "Период работы",
    question1: "Работал ли {name} в вашей компании в указанный период?",
    question2: "Вы бы наняли этого человека снова?",
    question3: "Комментарий (необязательно, но рекомендуется)",
    commentPlaceholder: "Оставьте краткий, деловой комментарий о работе водителя...",
    btnYes: "Да",
    btnNo: "Нет",
    btnConfirm: "Подтвердить и отправить",
    loadingText: "Проверка ссылки...",
    invalidLinkTitle: "Недействительная ссылка",
    invalidLinkDesc: "Ссылка для подтверждения неверна или истек ее срок действия.",
    successTitle: "Спасибо за ваш вклад в прозрачность.",
    successP1: "Вы только что помогли коллеге.",
    successP2: "А как вы сегодня управляете рисками, связанными с вашими водителями?",
    successP3: "\"Интуиция\" в транспортном бизнесе стоит слишком дорого. Присоединяйтесь к сообществу, которое принимает решения на основе фактов.",
    successBtn: "Присоединиться к доверенным перевозчикам"
  }
};
// --- END INTERNATIONALIZATION ---


interface RequestDetails {
    driverName: string;
    driverBirthDate?: string | null;
    requesterCompany: string;
    targetCompany?: string;
    startDate?: string | null;
    endDate?: string | null;
    isCurrentEmployer?: boolean;
}

const renderWithBold = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="text-foreground">{part}</strong> : <span key={index}>{part}</span>
    );
};

function VerificationPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [language, setLanguage] = useState<Lang>('LT');
  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [answers, setAnswers] = useState({
    workedHere: null as boolean | null,
    wouldRehire: null as boolean | null,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const t = (key: keyof typeof TRANSLATIONS.LT, params?: Record<string, string>) => {
      let str = TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN'][key] || '';
      if (params) {
          for (const p in params) {
              str = str.replace(`{${p}}`, params[p]);
          }
      }
      return str;
  };


  useEffect(() => {
    if (!token) {
        setErrorMessage(t('invalidLinkDesc'));
        setStep('invalid');
        return;
    }

    const fetchRequestData = async () => {
        try {
            const response = await fetch(`/api/checks/get-request?token=${token}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Nepavyko gauti užklausos duomenų.');
            }
            const data: RequestDetails = await response.json();
            setRequestDetails(data);
            setStep('form');
        } catch (error: any) {
            setErrorMessage(error.message);
            setStep('invalid');
        }
    };
    
    fetchRequestData();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.workedHere === null) {
      alert('Prašome atsakyti į pirmą klausimą.');
      return;
    }
    setIsSubmitting(true);
    
    console.log("Submitting answers:", { token, ...answers });
    setTimeout(() => {
      setStep('success');
      setIsSubmitting(false);
    }, 1000);
  };
  
  const renderQuestion1 = () => {
    if (!requestDetails) return '';
    return t('question1', { name: requestDetails.driverName });
  };
  
  const LanguageSwitcher = () => (
    <div className="absolute top-4 right-4 flex gap-1 border bg-muted p-1 rounded-md z-10">
        {(['LT', 'EN', 'PL', 'RU'] as Lang[]).map(lang => (
            <Button
                key={lang}
                size="sm"
                variant={language === lang ? 'secondary' : 'ghost'}
                onClick={() => setLanguage(lang)}
                className="h-7 px-2 text-xs"
            >
                {lang}
            </Button>
        ))}
    </div>
  );

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('loadingText')}</p>
      </div>
    );
  }
  
  if (step === 'invalid') {
     return (
      <Card className="w-full max-w-md border-destructive relative">
        <LanguageSwitcher />
        <CardHeader className="text-center items-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
            <CardTitle>{t('invalidLinkTitle')}</CardTitle>
            <CardDescription>
                {errorMessage || t('invalidLinkDesc')}
            </CardDescription>
        </CardHeader>
      </Card>
     )
  }

  if (step === 'success') {
    return (
        <div className="text-center space-y-6 py-4 w-full max-w-lg relative">
          <LanguageSwitcher />
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/10 p-4 ring-1 ring-green-500/50">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white">
            {t('successTitle')}
          </h2>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <p className="text-lg font-medium text-slate-200 mb-2">
              {t('successP1')} <br/>
              <span className="text-blue-400">{t('successP2')}</span>
            </p>
            <p className="text-sm text-slate-400">
              {t('successP3')}
            </p>
          </div>

          <button 
            onClick={() => window.location.href = '/signup'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 group"
          >
            {t('successBtn')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
    )
  }
  
  return (
    <Card className="w-full max-w-2xl relative">
        <LanguageSwitcher />
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('title')}</CardTitle>
                 <CardDescription className="text-base text-muted-foreground px-4 space-y-2 pt-2">
                    <p>{renderWithBold(t('intro', { name: requestDetails?.driverName || '...' }))}</p>
                    <p>{renderWithBold(t('companyInfo', { company: requestDetails?.targetCompany || '...' }))}</p>
                    <p>{t('cta')}</p>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                <div className="px-6">
                    <div className="bg-muted/50 p-4 rounded-md space-y-2 border text-left">
                        {requestDetails?.driverName && <div className="text-sm"><strong>{t('driverLabel')}:</strong> {requestDetails.driverName}</div>}
                        {requestDetails?.driverBirthDate && <div className="text-sm"><strong>{t('birthDateLabel')}:</strong> {new Date(requestDetails.driverBirthDate).toLocaleDateString(language.toLowerCase())}</div>}
                        {requestDetails?.startDate && (
                            <div className="text-sm">
                                <strong>{t('periodLabel')}:</strong> {new Date(requestDetails.startDate).toLocaleDateString(language.toLowerCase())} - {requestDetails.isCurrentEmployer ? 'dabar' : (requestDetails.endDate ? new Date(requestDetails.endDate).toLocaleDateString(language.toLowerCase()) : 'nežinoma')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center border-y py-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Užklausą siunčia: <span className="font-bold text-foreground">{requestDetails?.requesterCompany}</span></p>
                </div>
            
                <div className="space-y-3 px-6">
                    <label className="font-medium">1. {renderQuestion1()}</label>
                    <div className="flex gap-3">
                        <Button type="button" variant={answers.workedHere === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: true}))} className="flex-1">{t('btnYes')}</Button>
                        <Button type="button" variant={answers.workedHere === false ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: false}))} className="flex-1">{t('btnNo')}</Button>
                    </div>
                </div>

                <div className="space-y-3 px-6">
                    <label className="font-medium">2. {t('question2')}</label>
                    <div className="flex gap-3">
                        <Button type="button" variant={answers.wouldRehire === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: true}))} className="flex-1">
                            <CheckCircle className="mr-2 h-4 w-4"/> {t('btnYes')}
                        </Button>
                        <Button type="button" variant={answers.wouldRehire === false ? 'destructive' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: false}))} className="flex-1">
                            <AlertTriangle className="mr-2 h-4 w-4"/> {t('btnNo')}
                        </Button>
                    </div>
                </div>
            
                <div className="space-y-3 px-6">
                    <label htmlFor="comment" className="font-medium">3. {t('question3')}</label>
                    <Textarea 
                        id="comment"
                        placeholder={t('commentPlaceholder')}
                        value={answers.comment}
                        onChange={(e) => setAnswers(prev => ({...prev, comment: e.target.value}))}
                        rows={5}
                    />
                </div>
            
            </CardContent>
            <CardFooter className="flex-col items-center gap-4 bg-muted/50 p-6">
                <Button type="submit" className="w-full" disabled={isSubmitting || answers.workedHere === null}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('btnConfirm')}
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

export default function VerificationPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4 relative pt-20">
            <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
              <Link href="/" className="group flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="relative">
                  <UserSearch className="w-10 h-10 text-blue-500" strokeWidth={2.5} />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight italic">
                  Driver<span className="text-slate-300">Check</span>
                </span>
              </Link>
            </div>
            <Suspense fallback={<div className="flex flex-col items-center justify-center text-center gap-4 p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-muted-foreground">Kraunasi...</p></div>}>
                <VerificationPageContent />
            </Suspense>
        </div>
    );
}

    