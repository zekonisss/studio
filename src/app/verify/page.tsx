
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, UserSearch } from "lucide-react";
import Link from 'next/link';

interface RequestDetails {
    driverName: string;
    driverBirthDate?: string | null;
    requesterCompany: string;
    targetCompany?: string;
    startDate?: string | null;
    endDate?: string | null;
    isCurrentEmployer?: boolean;
}

// Helper component to use searchParams with Suspense
function VerificationPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [answers, setAnswers] = useState({
    workedHere: null as boolean | null,
    wouldRehire: null as boolean | null,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('Patvirtinimo nuoroda yra neteisinga arba nebegalioja.');

  useEffect(() => {
    if (!token) {
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
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.workedHere === null) {
      alert('Prašome atsakyti į pirmą klausimą.');
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API submission
    console.log("Submitting answers:", { token, ...answers });
    setTimeout(() => {
      setStep('success');
      setIsSubmitting(false);
    }, 1000);
  };
  
  const renderQuestion1 = () => {
    if (!requestDetails) return 'Ar šis asmuo dirbo Jūsų įmonėje?';
    
    const { startDate, endDate, isCurrentEmployer, driverName } = requestDetails;
    
    let dateString = '';
    if (isCurrentEmployer) {
      dateString = ' šiuo metu';
    } else if (startDate) {
      dateString = ` laikotarpiu nuo ${startDate}${endDate ? ` iki ${endDate}` : ''}`;
    }

    return `Ar ${driverName || 'šis asmuo'} dirbo Jūsų įmonėje${dateString}?`;
  };

  const renderQuestion2 = () => {
    if (requestDetails?.isCurrentEmployer) {
      return 'Jei darbuotojas nuspręstų išeiti, ar priimtumėte jį atgal ateityje?';
    }
    return 'Ar priimtumėte šį asmenį dirbti atgal?';
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Tikrinama nuoroda...</p>
      </div>
    );
  }
  
  if (step === 'invalid') {
     return (
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center items-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
            <CardTitle>Neteisinga Nuoroda</CardTitle>
            <CardDescription>
                {errorMessage}
            </CardDescription>
        </CardHeader>
      </Card>
     )
  }

  if (step === 'success') {
    return (
        <div className="text-center space-y-6 py-4 w-full max-w-lg">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/10 p-4 ring-1 ring-green-500/50">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white">
            Ačiū už Jūsų indėlį į skaidrumą.
          </h2>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <p className="text-lg font-medium text-slate-200 mb-2">
              Jūs ką tik padėjote kolegai. <br/>
              <span className="text-blue-400">O kaip Jūs šiandien valdote savo vairuotojų rizikas?</span>
            </p>
            <p className="text-sm text-slate-400">
              „Nuojauta“ transporto versle kainuoja per brangiai. Prisijunkite prie bendruomenės, kuri sprendimus priima remdamasi faktais.
            </p>
          </div>

          <button 
            onClick={() => window.location.href = '/signup'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 group"
          >
            Prisijungti prie Patikimų Vežėjų
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
    )
  }
  
  return (
    <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Vairuotojo Darbo Istorijos Patikra</CardTitle>
                 <CardDescription className="text-base text-muted-foreground px-4 space-y-2 pt-2">
                    <p>
                        <strong>DriverCheck</strong> – vairuotojų patikros sistemoje buvo sukurta užklausa dėl vairuotojo <strong>{requestDetails?.driverName}</strong>.
                    </p>
                    <p>
                        Jūsų įmonė <strong>{requestDetails?.targetCompany}</strong> buvo nurodyta kaip buvusi šio vairuotojo darbovietė.
                    </p>
                    <p>
                        Maloniai kviečiame Jus patvirtinti arba patikslinti šį įrašą.
                    </p>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                <div className="px-6">
                    <div className="bg-muted/50 p-4 rounded-md space-y-2 border text-left">
                        <h4 className="font-semibold text-foreground">Užklausos duomenys</h4>
                        <div className="text-sm">
                            <strong>Vairuotojas:</strong> {requestDetails?.driverName}
                        </div>
                        {requestDetails?.driverBirthDate && (
                             <div className="text-sm">
                                <strong>Gimimo data:</strong> {new Date(requestDetails.driverBirthDate).toLocaleDateString('lt-LT')}
                            </div>
                        )}
                        {(requestDetails?.startDate) && (
                            <div className="text-sm">
                                <strong>Darbo laikotarpis:</strong> {new Date(requestDetails.startDate).toLocaleDateString('lt-LT')} - {requestDetails.isCurrentEmployer ? 'dabar' : (requestDetails.endDate ? new Date(requestDetails.endDate).toLocaleDateString('lt-LT') : 'nežinoma')}
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
                        <Button type="button" variant={answers.workedHere === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: true}))} className="flex-1">Taip</Button>
                        <Button type="button" variant={answers.workedHere === false ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: false}))} className="flex-1">Ne</Button>
                    </div>
                </div>

                <div className="space-y-3 px-6">
                    <label className="font-medium">2. {renderQuestion2()}</label>
                    <div className="flex gap-3">
                        <Button type="button" variant={answers.wouldRehire === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: true}))} className="flex-1">
                            <CheckCircle className="mr-2 h-4 w-4"/> Taip
                        </Button>
                        <Button type="button" variant={answers.wouldRehire === false ? 'destructive' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: false}))} className="flex-1">
                            <AlertTriangle className="mr-2 h-4 w-4"/> Ne
                        </Button>
                    </div>
                </div>
            
                <div className="space-y-3 px-6">
                    <label htmlFor="comment" className="font-medium">3. Komentaras (neprivaloma, bet rekomenduojama)</label>
                    <Textarea 
                        id="comment"
                        placeholder="Pateikite trumpą, dalykišką komentarą apie vairuotojo veiklą, pvz., 'kuro normos viršijimas', 'dažni vėlavimai', 'atsakingas darbuotojas'..."
                        value={answers.comment}
                        onChange={(e) => setAnswers(prev => ({...prev, comment: e.target.value}))}
                        rows={5}
                    />
                </div>
            
            </CardContent>
            <CardFooter className="flex-col items-center gap-4 bg-muted/50 p-6">
                <Button type="submit" className="w-full" disabled={isSubmitting || answers.workedHere === null}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Patvirtinti ir Išsiųsti
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

// Main component that wraps content in Suspense
export default function VerificationPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4 relative pt-20">
            {/* Real Brand Header */}
            <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
              <Link href="/" className="group flex items-center gap-3 hover:opacity-90 transition-opacity">
                {/* Icon: User with Search (Blue) */}
                <div className="relative">
                  <UserSearch className="w-10 h-10 text-blue-500" strokeWidth={2.5} />
                </div>
                
                {/* Text: DriverCheck (Italic, Bold) */}
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
